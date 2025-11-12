from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, Employee
from datetime import datetime

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# ============== USER AUTHENTICATION ==============

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user (vendor/publisher)"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['username', 'email', 'password', 'business_name', 'business_type']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Check if user already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 409
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 409
    
    try:
        user = User(
            username=data['username'],
            email=data['email'],
            business_name=data['business_name'],
            business_type=data['business_type'],
            phone=data.get('phone'),
            address=data.get('address'),
            city=data.get('city'),
            country=data.get('country')
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Create tokens - identity must be a string
        access_token = create_access_token(identity=str(user.id), additional_claims={'type': 'user'})
        refresh_token = create_refresh_token(identity=str(user.id), additional_claims={'type': 'user'})
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user (vendor/publisher)"""
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing email or password'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    if not user.is_active:
        return jsonify({'error': 'User account is inactive'}), 403
    
    # Create tokens - identity must be a string
    access_token = create_access_token(identity=str(user.id), additional_claims={'type': 'user'})
    refresh_token = create_refresh_token(identity=str(user.id), additional_claims={'type': 'user'})
    
    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 200

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    identity = get_jwt_identity()
    user = User.query.get(identity)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    access_token = create_access_token(identity=str(user.id), additional_claims={'type': 'user'})
    return jsonify({'access_token': access_token}), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user information"""
    user_id = get_jwt_identity()
    # Convert string ID back to int for query
    user = User.query.get(int(user_id))
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(user.to_dict()), 200

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    # Update fields
    if 'business_name' in data:
        user.business_name = data['business_name']
    if 'phone' in data:
        user.phone = data['phone']
    if 'address' in data:
        user.address = data['address']
    if 'city' in data:
        user.city = data['city']
    if 'country' in data:
        user.country = data['country']
    
    user.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'message': 'Profile updated successfully',
        'user': user.to_dict()
    }), 200

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    if not data.get('old_password') or not data.get('new_password'):
        return jsonify({'error': 'Missing old_password or new_password'}), 400
    
    if not user.check_password(data['old_password']):
        return jsonify({'error': 'Old password is incorrect'}), 401
    
    user.set_password(data['new_password'])
    db.session.commit()
    
    return jsonify({'message': 'Password changed successfully'}), 200

# ============== EMPLOYEE AUTHENTICATION ==============

@auth_bp.route('/employee/register', methods=['POST'])
def employee_register():
    """Register a new employee (admin only)"""
    data = request.get_json()
    
    required_fields = ['username', 'email', 'password', 'full_name']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    if Employee.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 409
    
    if Employee.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 409
    
    try:
        employee = Employee(
            username=data['username'],
            email=data['email'],
            full_name=data['full_name'],
            role=data.get('role', 'staff')
        )
        employee.set_password(data['password'])
        
        db.session.add(employee)
        db.session.commit()
        
        access_token = create_access_token(identity=str(employee.id), additional_claims={'type': 'employee'})
        refresh_token = create_refresh_token(identity=str(employee.id), additional_claims={'type': 'employee'})
        
        return jsonify({
            'message': 'Employee registered successfully',
            'employee': employee.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/employee/login', methods=['POST'])
def employee_login():
    """Login employee"""
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing email or password'}), 400
    
    employee = Employee.query.filter_by(email=data['email']).first()
    
    if not employee or not employee.check_password(data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    if not employee.is_active:
        return jsonify({'error': 'Employee account is inactive'}), 403
    
    access_token = create_access_token(identity=str(employee.id), additional_claims={'type': 'employee'})
    refresh_token = create_refresh_token(identity=str(employee.id), additional_claims={'type': 'employee'})
    
    return jsonify({
        'message': 'Login successful',
        'employee': employee.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 200

@auth_bp.route('/employee/me', methods=['GET'])
@jwt_required()
def get_current_employee():
    """Get current employee information"""
    emp_id = get_jwt_identity()
    employee = Employee.query.get(int(emp_id))
    
    if not employee:
        return jsonify({'error': 'Employee not found'}), 404
    
    return jsonify(employee.to_dict()), 200
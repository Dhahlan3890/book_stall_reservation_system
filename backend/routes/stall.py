from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Stall, Reservation, User
from sqlalchemy import and_

stall_bp = Blueprint('stalls', __name__, url_prefix='/api/stalls')

@stall_bp.route('', methods=['GET'])
def get_all_stalls():
    """Get all stalls with availability status"""
    stalls = Stall.query.all()
    
    stall_list = []
    for stall in stalls:
        stall_data = stall.to_dict()
        # Check if reserved
        active_reservation = Reservation.query.filter(
            and_(
                Reservation.stall_id == stall.id,
                Reservation.status == 'confirmed'
            )
        ).first()
        stall_data['is_reserved'] = active_reservation is not None
        stall_data['reserved_by'] = None
        if active_reservation:
            stall_data['reserved_by'] = active_reservation.user.username
        stall_list.append(stall_data)
    
    return jsonify(stall_list), 200

@stall_bp.route('/<int:stall_id>', methods=['GET'])
def get_stall(stall_id):
    """Get stall details"""
    stall = Stall.query.get(stall_id)
    
    if not stall:
        return jsonify({'error': 'Stall not found'}), 404
    
    stall_data = stall.to_dict()
    active_reservation = Reservation.query.filter(
        and_(
            Reservation.stall_id == stall.id,
            Reservation.status == 'confirmed'
        )
    ).first()
    stall_data['is_reserved'] = active_reservation is not None
    stall_data['reserved_by'] = None
    if active_reservation:
        stall_data['reserved_by'] = active_reservation.user.username
    
    return jsonify(stall_data), 200

@stall_bp.route('/by-size/<size>', methods=['GET'])
def get_stalls_by_size(size):
    """Get stalls by size"""
    if size not in ['small', 'medium', 'large']:
        return jsonify({'error': 'Invalid size. Must be small, medium, or large'}), 400
    
    stalls = Stall.query.filter_by(size=size).all()
    
    stall_list = []
    for stall in stalls:
        stall_data = stall.to_dict()
        active_reservation = Reservation.query.filter(
            and_(
                Reservation.stall_id == stall.id,
                Reservation.status == 'confirmed'
            )
        ).first()
        stall_data['is_reserved'] = active_reservation is not None
        stall_data['reserved_by'] = None
        if active_reservation:
            stall_data['reserved_by'] = active_reservation.user.username
        stall_list.append(stall_data)
    
    return jsonify(stall_list), 200

@stall_bp.route('/stats', methods=['GET'])
def get_stall_stats():
    """Get stall statistics"""
    total_stalls = Stall.query.count()
    reserved_stalls = db.session.query(Reservation).filter_by(status='confirmed').distinct(Reservation.stall_id).count()
    available_stalls = total_stalls - reserved_stalls
    
    stalls_by_size = {
        'small': Stall.query.filter_by(size='small').count(),
        'medium': Stall.query.filter_by(size='medium').count(),
        'large': Stall.query.filter_by(size='large').count()
    }
    
    return jsonify({
        'total_stalls': total_stalls,
        'reserved_stalls': reserved_stalls,
        'available_stalls': available_stalls,
        'stalls_by_size': stalls_by_size
    }), 200

# Admin endpoints for creating stalls
@stall_bp.route('', methods=['POST'])
def create_stall():
    """Create a new stall (admin only)"""
    data = request.get_json()
    
    required_fields = ['name', 'size', 'location_x', 'location_y', 'price']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    if Stall.query.filter_by(name=data['name']).first():
        return jsonify({'error': 'Stall with this name already exists'}), 409
    
    try:
        stall = Stall(
            name=data['name'],
            size=data['size'],
            location_x=data['location_x'],
            location_y=data['location_y'],
            dimensions=data.get('dimensions'),
            price=data['price'],
            is_available=data.get('is_available', True)
        )
        db.session.add(stall)
        db.session.commit()
        
        return jsonify({
            'message': 'Stall created successfully',
            'stall': stall.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@stall_bp.route('/<int:stall_id>', methods=['PUT'])
def update_stall(stall_id):
    """Update stall (admin only)"""
    stall = Stall.query.get(stall_id)
    
    if not stall:
        return jsonify({'error': 'Stall not found'}), 404
    
    data = request.get_json()
    
    if 'name' in data:
        stall.name = data['name']
    if 'size' in data:
        stall.size = data['size']
    if 'location_x' in data:
        stall.location_x = data['location_x']
    if 'location_y' in data:
        stall.location_y = data['location_y']
    if 'dimensions' in data:
        stall.dimensions = data['dimensions']
    if 'price' in data:
        stall.price = data['price']
    if 'is_available' in data:
        stall.is_available = data['is_available']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Stall updated successfully',
        'stall': stall.to_dict()
    }), 200
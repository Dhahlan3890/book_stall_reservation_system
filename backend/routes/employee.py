from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Stall, Reservation, User, Employee

employee_bp = Blueprint('employee', __name__, url_prefix='/api/employee')

@employee_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
    """Get employee dashboard data"""
    total_users = User.query.count()
    total_reservations = Reservation.query.count()
    confirmed_reservations = Reservation.query.filter_by(status='confirmed').count()
    total_stalls = Stall.query.count()
    
    available_stalls = total_stalls - confirmed_reservations
    
    return jsonify({
        'total_users': total_users,
        'total_reservations': total_reservations,
        'confirmed_reservations': confirmed_reservations,
        'total_stalls': total_stalls,
        'available_stalls': available_stalls,
        'occupancy_rate': (confirmed_reservations / total_stalls * 100) if total_stalls > 0 else 0
    }), 200

@employee_bp.route('/stalls', methods=['GET'])
@jwt_required()
def get_stalls_report():
    """Get detailed stall information"""
    stalls = Stall.query.all()
    
    stalls_data = []
    for stall in stalls:
        stall_data = stall.to_dict()
        active_reservation = Reservation.query.filter_by(
            stall_id=stall.id,
            status='confirmed'
        ).first()
        
        if active_reservation:
            stall_data['reserved'] = True
            stall_data['reserved_by'] = active_reservation.user.business_name
            stall_data['reserved_date'] = active_reservation.confirmed_at.isoformat()
            stall_data['qr_code'] = active_reservation.qr_code
            stall_data['qr_data'] = active_reservation.qr_data
        else:
            stall_data['reserved'] = False
            stall_data['reserved_by'] = None
            stall_data['reserved_date'] = None
            stall_data['qr_code'] = None
            stall_data['qr_data'] = None
        
        stalls_data.append(stall_data)
    
    return jsonify(stalls_data), 200

@employee_bp.route('/reservations', methods=['GET'])
@jwt_required()
def get_all_reservations():
    """Get all reservations with details"""
    status = request.args.get('status')
    
    query = Reservation.query
    if status:
        query = query.filter_by(status=status)
    
    reservations = query.all()
    
    res_list = []
    for res in reservations:
        res_data = res.to_dict()
        res_data['user'] = {
            'id': res.user.id,
            'business_name': res.user.business_name,
            'email': res.user.email,
            'phone': res.user.phone,
            'username': res.user.username
        }
        res_list.append(res_data)
    
    return jsonify(res_list), 200

@employee_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    """Get all users"""
    users = User.query.all()
    
    users_data = []
    for user in users:
        user_data = user.to_dict()
        user_data['total_reservations'] = Reservation.query.filter_by(
            user_id=user.id,
            status='confirmed'
        ).count()
        users_data.append(user_data)
    
    return jsonify(users_data), 200

@employee_bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user_details(user_id):
    """Get detailed user information"""
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    user_data = user.to_dict()
    user_data['reservations'] = [
        res.to_dict() for res in Reservation.query.filter_by(user_id=user_id).all()
    ]
    user_data['genres'] = [g.to_dict() for g in user.genres]
    
    return jsonify(user_data), 200

@employee_bp.route('/analytics/occupancy', methods=['GET'])
@jwt_required()
def get_occupancy_analytics():
    """Get stall occupancy analytics by size"""
    sizes = ['small', 'medium', 'large']
    
    analytics = {}
    for size in sizes:
        total = Stall.query.filter_by(size=size).count()
        reserved = db.session.query(Stall).join(Reservation).filter(
            Stall.size == size,
            Reservation.status == 'confirmed'
        ).count()
        
        analytics[size] = {
            'total': total,
            'reserved': reserved,
            'available': total - reserved,
            'occupancy_rate': (reserved / total * 100) if total > 0 else 0
        }
    
    return jsonify(analytics), 200

@employee_bp.route('/analytics/revenue', methods=['GET'])
@jwt_required()
def get_revenue_analytics():
    """Get revenue analytics"""
    total_revenue = db.session.query(db.func.sum(Stall.price)).join(
        Reservation
    ).filter(
        Reservation.status == 'confirmed'
    ).scalar() or 0
    
    revenue_by_size = {}
    for size in ['small', 'medium', 'large']:
        revenue = db.session.query(db.func.sum(Stall.price)).filter(
            Stall.size == size
        ).join(
            Reservation
        ).filter(
            Reservation.status == 'confirmed'
        ).scalar() or 0
        
        revenue_by_size[size] = revenue
    
    return jsonify({
        'total_revenue': total_revenue,
        'revenue_by_size': revenue_by_size
    }), 200

@employee_bp.route('/reservations/<int:reservation_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_reservation_admin(reservation_id):
    """Cancel a reservation (admin/employee only)"""
    from datetime import datetime
    from utils import send_cancellation_email
    
    reservation = Reservation.query.get(reservation_id)
    
    if not reservation:
        return jsonify({'error': 'Reservation not found'}), 404
    
    if reservation.status == 'cancelled':
        return jsonify({'error': 'Reservation is already cancelled'}), 400
    
    try:
        reservation.status = 'cancelled'
        reservation.cancelled_at = datetime.utcnow()
        db.session.commit()
        
        # Send cancellation email to vendor
        send_cancellation_email(
            reservation.user.email,
            reservation.user.business_name,
            reservation.stall.name
        )
        
        return jsonify({
            'message': 'Reservation cancelled successfully',
            'reservation': reservation.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@employee_bp.route('/reservations/<int:reservation_id>/approve', methods=['POST'])
@jwt_required()
def approve_reservation(reservation_id):
    """Approve a pending reservation (admin/employee only)"""
    from datetime import datetime
    from utils import send_reservation_email, generate_qr_code
    
    reservation = Reservation.query.get(reservation_id)
    
    if not reservation:
        return jsonify({'error': 'Reservation not found'}), 404
    
    if reservation.status != 'pending':
        return jsonify({'error': f'Cannot approve {reservation.status} reservation'}), 400
    
    try:
        # Update reservation to confirmed
        reservation.status = 'confirmed'
        reservation.confirmed_at = datetime.utcnow()
        db.session.commit()
        
        # Send confirmation email to vendor
        qr_image = generate_qr_code(reservation.qr_data)[1]
        send_reservation_email(
            reservation.user.email,
            reservation.user.business_name,
            reservation.stall.name,
            reservation.qr_data,
            qr_image
        )
        
        return jsonify({
            'message': 'Reservation approved successfully. Email sent to vendor.',
            'reservation': reservation.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@employee_bp.route('/reservations/<int:reservation_id>/reject', methods=['POST'])
@jwt_required()
def reject_reservation(reservation_id):
    """Reject a pending reservation (admin/employee only)"""
    from datetime import datetime
    from utils import send_cancellation_email
    
    reservation = Reservation.query.get(reservation_id)
    
    if not reservation:
        return jsonify({'error': 'Reservation not found'}), 404
    
    if reservation.status != 'pending':
        return jsonify({'error': f'Cannot reject {reservation.status} reservation'}), 400
    
    try:
        reason = request.get_json().get('reason', 'No reason provided') if request.get_json() else 'No reason provided'
        
        reservation.status = 'cancelled'
        reservation.cancelled_at = datetime.utcnow()
        reservation.notes = f"Rejected by admin: {reason}"
        db.session.commit()
        
        # Send rejection email to vendor
        send_cancellation_email(
            reservation.user.email,
            reservation.user.business_name,
            f"{reservation.stall.name} (Request Rejected)"
        )
        
        return jsonify({
            'message': 'Reservation rejected successfully. Email sent to vendor.',
            'reservation': reservation.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

<<<<<<< HEAD
# Import db here to use db.func
from models import db
=======

from models import db
>>>>>>> 7c969f931cc5f3b8a87b1f3be6458d242943be9e

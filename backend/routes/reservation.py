from typing import List, Dict, Any

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Reservation, Stall, User
from utils import (
    generate_qr_code,
    generate_unique_qr_data,
    send_reservation_email,
    send_cancellation_email,
    get_jwt_user_id,
)
from datetime import datetime
from sqlalchemy import and_

reservation_bp = Blueprint('reservations', __name__, url_prefix='/api/reservations')


@reservation_bp.route('', methods=['POST'])
@jwt_required()
def create_reservation() -> tuple:
    """Create a new reservation (pending by default, requires admin approval)"""
    user_id = get_jwt_user_id()
    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json() or {}

    if not data.get('stall_id'):
        return jsonify({'error': 'Missing stall_id'}), 400

    # Check reservation limit (max 3 per user - confirmed reservations)
    current_confirmed = Reservation.query.filter_by(
        user_id=user_id,
        status='confirmed'
    ).count()

    if current_confirmed >= 3:
        return jsonify({'error': 'Maximum 3 stalls per business allowed'}), 400

    stall = Stall.query.get(data['stall_id'])
    if not stall:
        return jsonify({'error': 'Stall not found'}), 404

    # Check if stall already reserved or pending
    existing = Reservation.query.filter(
        and_(
            Reservation.stall_id == stall.id,
            Reservation.status.in_(['confirmed', 'pending'])
        )
    ).first()

    if existing:
        if existing.status == 'confirmed':
            return jsonify({'error': 'This stall is already reserved'}), 409
        else:
            return jsonify({'error': 'This stall already has a pending reservation'}), 409

    # Check if user already reserved this stall
    user_stall = Reservation.query.filter(
        and_(
            Reservation.user_id == user_id,
            Reservation.stall_id == stall.id,
            Reservation.status.in_(['confirmed', 'pending'])
        )
    ).first()

    if user_stall:
        if user_stall.status == 'confirmed':
            return jsonify({'error': 'You have already reserved this stall'}), 409
        else:
            return jsonify({'error': 'You already have a pending request for this stall'}), 409

    try:
        # Generate QR code data only for confirmed reservations
        qr_data = generate_unique_qr_data()
        qr_base64, _qr_image = generate_qr_code(qr_data)

        # Create pending reservation - will be confirmed by admin
        reservation = Reservation(
            user_id=user_id,
            stall_id=stall.id,
            qr_code=qr_base64,
            qr_data=qr_data,
            status='pending',
            notes=data.get('notes')
        )

        db.session.add(reservation)
        db.session.commit()

        # Send pending request email to vendor
        # (Admin approval will send confirmation email)
        return jsonify({
            'message': 'Reservation request created successfully. Waiting for admin approval.',
            'reservation': reservation.to_dict(),
            'status': 'pending'
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@reservation_bp.route('', methods=['GET'])
@jwt_required()
def get_user_reservations() -> tuple:
    """Get user's reservations"""
    user_id = get_jwt_user_id()

    reservations = Reservation.query.filter_by(user_id=user_id).all()

    return jsonify([res.to_dict() for res in reservations]), 200


@reservation_bp.route('/<int:reservation_id>', methods=['GET'])
@jwt_required()
def get_reservation(reservation_id: int) -> tuple:
    """Get reservation details"""
    user_id = get_jwt_user_id()

    reservation = Reservation.query.get(reservation_id)

    if not reservation:
        return jsonify({'error': 'Reservation not found'}), 404

    if reservation.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    return jsonify(reservation.to_dict()), 200


@reservation_bp.route('/<int:reservation_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_reservation(reservation_id: int) -> tuple:
    """Cancel a reservation"""
    user_id = get_jwt_user_id()
    user = User.query.get(user_id)

    reservation = Reservation.query.get(reservation_id)

    if not reservation:
        return jsonify({'error': 'Reservation not found'}), 404

    if reservation.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    if reservation.status == 'cancelled':
        return jsonify({'error': 'Reservation is already cancelled'}), 400

    try:
        reservation.status = 'cancelled'
        reservation.cancelled_at = datetime.utcnow()
        db.session.commit()

        # Send cancellation email
        send_cancellation_email(user.email, user.business_name, reservation.stall.name)

        return jsonify({
            'message': 'Reservation cancelled successfully',
            'reservation': reservation.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@reservation_bp.route('/<int:reservation_id>/qr', methods=['GET'])
@jwt_required()
def get_reservation_qr(reservation_id: int) -> tuple:
    """Get QR code for reservation"""
    user_id = get_jwt_user_id()

    reservation = Reservation.query.get(reservation_id)

    if not reservation:
        return jsonify({'error': 'Reservation not found'}), 404

    if reservation.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    return jsonify({
        'qr_code': reservation.qr_code,
        'qr_data': reservation.qr_data,
        'stall_name': reservation.stall.name
    }), 200


# Admin endpoints
@reservation_bp.route('/admin/all', methods=['GET'])
def get_all_reservations() -> tuple:
    """Get all reservations (admin only)"""
    reservations = Reservation.query.all()

    res_list: List[Dict[str, Any]] = []
    for res in reservations:
        res_data = res.to_dict()
        res_data['user'] = res.user.to_dict()
        res_list.append(res_data)

    return jsonify(res_list), 200


@reservation_bp.route('/admin/stats', methods=['GET'])
def get_reservation_stats() -> tuple:
    """Get reservation statistics"""
    total = Reservation.query.count()
    confirmed = Reservation.query.filter_by(status='confirmed').count()
    cancelled = Reservation.query.filter_by(status='cancelled').count()
    pending = Reservation.query.filter_by(status='pending').count()

    return jsonify({
        'total_reservations': total,
        'confirmed': confirmed,
        'cancelled': cancelled,
        'pending': pending
    }), 200
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Genre, User, UserGenre
from utils import get_jwt_user_id

genre_bp = Blueprint('genres', __name__, url_prefix='/api/genres')

@genre_bp.route('', methods=['GET'])
def get_all_genres():
    """Get all available genres"""
    genres = Genre.query.all()
    return jsonify([g.to_dict() for g in genres]), 200

@genre_bp.route('/<int:genre_id>', methods=['GET'])
def get_genre(genre_id):
    """Get genre details"""
    genre = Genre.query.get(genre_id)
    
    if not genre:
        return jsonify({'error': 'Genre not found'}), 404
    
    return jsonify(genre.to_dict()), 200

@genre_bp.route('/user/genres/<int:genre_id>', methods=['POST'])
@jwt_required()
def add_single_user_genre(genre_id):
    """Add single genre to user's profile"""
    user_id = get_jwt_user_id()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    genre = Genre.query.get(genre_id)
    if not genre:
        return jsonify({'error': 'Genre not found'}), 404
    
    # Check if already added
    existing = UserGenre.query.filter_by(user_id=user_id, genre_id=genre_id).first()
    if existing:
        return jsonify({'error': 'Genre already added'}), 409
    
    try:
        user_genre = UserGenre(user_id=user_id, genre_id=genre_id)
        db.session.add(user_genre)
        db.session.commit()
        
        return jsonify({
            'message': 'Genre added successfully',
            'genres': [g.to_dict() for g in user.genres]
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@genre_bp.route('/user/genres/<int:genre_id>', methods=['DELETE'])
@jwt_required()
def remove_user_genre(genre_id):
    """Remove genre from user's profile"""
    user_id = get_jwt_user_id()
    
    user_genre = UserGenre.query.filter_by(user_id=user_id, genre_id=genre_id).first()
    
    if not user_genre:
        return jsonify({'error': 'Genre not found for user'}), 404
    
    try:
        db.session.delete(user_genre)
        db.session.commit()
        
        user = User.query.get(user_id)
        return jsonify({
            'message': 'Genre removed successfully',
            'genres': [g.to_dict() for g in user.genres]
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@genre_bp.route('/user/genres', methods=['GET'])
@jwt_required()
def get_user_genres():
    """Get genres selected by user"""
    user_id = get_jwt_user_id()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify([g.to_dict() for g in user.genres]), 200

@genre_bp.route('/user/genres', methods=['POST'])
@jwt_required()
def add_user_genres():
    """Add genres to user's profile"""
    user_id = get_jwt_user_id()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    if not data.get('genre_ids') or not isinstance(data['genre_ids'], list):
        return jsonify({'error': 'Missing or invalid genre_ids'}), 400
    
    try:
        # Remove existing genres
        UserGenre.query.filter_by(user_id=user_id).delete()
        
        # Add new genres
        for genre_id in data['genre_ids']:
            genre = Genre.query.get(genre_id)
            if genre:
                user_genre = UserGenre(user_id=user_id, genre_id=genre_id)
                db.session.add(user_genre)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Genres updated successfully',
            'genres': [g.to_dict() for g in user.genres]
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Admin endpoints
@genre_bp.route('', methods=['POST'])
def create_genre():
    """Create a new genre (admin only)"""
    data = request.get_json()
    
    if not data.get('name'):
        return jsonify({'error': 'Missing genre name'}), 400
    
    if Genre.query.filter_by(name=data['name']).first():
        return jsonify({'error': 'Genre already exists'}), 409
    
    try:
        genre = Genre(
            name=data['name'],
            description=data.get('description'),
            icon=data.get('icon')
        )
        db.session.add(genre)
        db.session.commit()
        
        return jsonify({
            'message': 'Genre created successfully',
            'genre': genre.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
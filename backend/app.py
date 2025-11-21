import os
from flask import Flask, g
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

from config import config
from models import db
from routes import auth_bp, stall_bp, reservation_bp, genre_bp, employee_bp
from debug_utils import RequestLogger, logger, log_jwt_error

def create_app(config_name=None):
    """Create and configure Flask app"""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    logger.info(f"Starting Flask app in {config_name} mode")
    
    # Initialize extensions
    db.init_app(app)
    jwt = JWTManager(app)
    CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000", "http://localhost:3001", "http://localhost:5000"]}})
    
    # JWT error handlers
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        log_jwt_error(f"Invalid token: {error}")
        return {'error': 'Invalid token', 'details': str(error)}, 401
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_data):
        log_jwt_error(f"Token expired for user {jwt_data.get('sub')}")
        return {'error': 'Token expired', 'details': 'Please refresh your token'}, 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        log_jwt_error(f"Missing token: {error}")
        return {'error': 'Missing authorization token', 'details': str(error)}, 401
    
    # Request logging
    @app.before_request
    def before_request():
        RequestLogger.log_request()
        g.start_time = __import__('datetime').datetime.now()
    
    @app.after_request
    def after_request(response):
        duration = (__import__('datetime').datetime.now() - g.start_time).total_seconds()
        logger.info(f"Response: {response.status_code} | Duration: {duration:.2f}s")
        return response
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(stall_bp)
    app.register_blueprint(reservation_bp)
    app.register_blueprint(genre_bp)
    app.register_blueprint(employee_bp)
    
    # Create tables
    with app.app_context():
        db.create_all()
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health():
        return {'status': 'ok'}, 200
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)

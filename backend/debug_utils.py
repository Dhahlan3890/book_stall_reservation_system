"""
Debug and logging utilities for backend
Provides detailed logging, request inspection, and error tracking
"""

import logging
import json
from datetime import datetime
from functools import wraps
from flask import request, g
import traceback

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s',
    handlers=[
        logging.FileHandler('backend_debug.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class RequestLogger:
    """Log detailed request information"""
    
    @staticmethod
    def log_request():
        """Log incoming request details"""
        g.start_time = datetime.now()
        g.request_id = f"{g.start_time.timestamp()}"
        
        logger.info(f"\n{'='*80}")
        logger.info(f"REQUEST #{g.request_id}")
        logger.info(f"Method: {request.method} {request.path}")
        logger.info(f"URL: {request.base_url}")
        logger.info(f"Headers: {dict(request.headers)}")
        
        # Log body for POST/PUT requests
        if request.method in ['POST', 'PUT', 'PATCH']:
            try:
                logger.info(f"Body: {request.get_json()}")
            except:
                logger.info(f"Body: {request.data}")
        
        logger.info(f"Remote Address: {request.remote_addr}")

    @staticmethod
    def log_response(response, status_code, duration):
        """Log response details"""
        logger.info(f"Response Status: {status_code}")
        logger.info(f"Response Duration: {duration:.2f}s")
        
        try:
            if response:
                logger.info(f"Response Data: {response}")
        except:
            pass
        
        logger.info(f"{'='*80}\n")

def debug_route(f):
    """Decorator to add comprehensive debugging to routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        RequestLogger.log_request()
        
        try:
            logger.debug(f"Executing route: {f.__name__}")
            result = f(*args, **kwargs)
            
            # Calculate duration
            duration = (datetime.now() - g.start_time).total_seconds()
            
            if isinstance(result, tuple):
                response, status_code = result
            else:
                response, status_code = result, 200
            
            RequestLogger.log_response(response, status_code, duration)
            return result
            
        except Exception as e:
            logger.error(f"ERROR in {f.__name__}: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            
            duration = (datetime.now() - g.start_time).total_seconds()
            logger.info(f"Failed Duration: {duration:.2f}s")
            logger.info(f"{'='*80}\n")
            
            raise
    
    return decorated_function

def log_database_query(query_str, params=None):
    """Log database queries"""
    logger.debug(f"DB Query: {query_str}")
    if params:
        logger.debug(f"Params: {params}")

def log_jwt_error(error_msg):
    """Log JWT-related errors"""
    logger.error(f"JWT Error: {error_msg}")
    logger.error(f"Traceback: {traceback.format_exc()}")

def log_api_call(endpoint, method, status, duration):
    """Log external API calls"""
    logger.info(f"API Call - {method} {endpoint} [{status}] ({duration:.2f}s)")

def inspect_request():
    """Return detailed request inspection data"""
    return {
        'timestamp': datetime.now().isoformat(),
        'method': request.method,
        'path': request.path,
        'url': request.url,
        'headers': dict(request.headers),
        'args': dict(request.args),
        'remote_addr': request.remote_addr,
        'endpoint': request.endpoint,
        'request_id': getattr(g, 'request_id', 'N/A')
    }

def inspect_jwt_token(token_str):
    """Inspect JWT token structure (for debugging)"""
    try:
        import base64
        parts = token_str.split('.')
        if len(parts) != 3:
            return {'error': 'Invalid JWT structure'}
        
        # Decode header and payload (these are base64url encoded)
        header = json.loads(base64.urlsafe_b64decode(parts[0] + '=='))
        payload = json.loads(base64.urlsafe_b64decode(parts[1] + '=='))
        
        return {
            'header': header,
            'payload': payload,
            'signature_present': bool(parts[2])
        }
    except Exception as e:
        logger.error(f"JWT inspection failed: {str(e)}")
        return {'error': str(e)}

# Error response formatter
def format_error_response(error_msg, status_code=400, details=None):
    """Format consistent error responses"""
    response = {
        'error': error_msg,
        'status': status_code,
        'timestamp': datetime.now().isoformat()
    }
    
    if details:
        response['details'] = details
    
    if hasattr(g, 'request_id'):
        response['request_id'] = g.request_id
    
    logger.error(f"Error Response: {response}")
    return response, status_code

# Success response formatter
def format_success_response(data=None, message='Success', status_code=200):
    """Format consistent success responses"""
    response = {
        'message': message,
        'status': status_code,
        'data': data,
        'timestamp': datetime.now().isoformat()
    }
    
    if hasattr(g, 'request_id'):
        response['request_id'] = g.request_id
    
    logger.debug(f"Success Response: {message}")
    return response, status_code

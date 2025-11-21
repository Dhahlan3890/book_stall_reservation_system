from .auth import auth_bp
from .stall import stall_bp
from .reservation import reservation_bp
from .genre import genre_bp
from .employee import employee_bp

__all__ = ['auth_bp', 'stall_bp', 'reservation_bp', 'genre_bp', 'employee_bp']
#!/usr/bin/env python
"""
Database initialization script
Creates all tables and populates with initial data
"""

from app import create_app, db
from models import Stall, Genre, Employee

def init_db():
    """Initialize database with sample data"""
    app = create_app()
    
    with app.app_context():
        # Create all tables
        db.create_all()
        print("✓ Database tables created")
        
        # Add sample stalls if not exists
        if Stall.query.count() == 0:
            stalls = [
                # Small stalls
                Stall(name='A1', size='small', location_x=10, location_y=10, dimensions='10x10 sq ft', price=500),
                Stall(name='A2', size='small', location_x=30, location_y=10, dimensions='10x10 sq ft', price=500),
                Stall(name='A3', size='small', location_x=50, location_y=10, dimensions='10x10 sq ft', price=500),
                Stall(name='B1', size='small', location_x=70, location_y=10, dimensions='10x10 sq ft', price=500),
                Stall(name='B2', size='small', location_x=90, location_y=10, dimensions='10x10 sq ft', price=500),
                
                # Medium stalls
                Stall(name='C1', size='medium', location_x=10, location_y=50, dimensions='15x15 sq ft', price=1000),
                Stall(name='C2', size='medium', location_x=40, location_y=50, dimensions='15x15 sq ft', price=1000),
                Stall(name='C3', size='medium', location_x=70, location_y=50, dimensions='15x15 sq ft', price=1000),
                Stall(name='D1', size='medium', location_x=10, location_y=80, dimensions='15x15 sq ft', price=1000),
                Stall(name='D2', size='medium', location_x=40, location_y=80, dimensions='15x15 sq ft', price=1000),
                
                # Large stalls
                Stall(name='E1', size='large', location_x=70, location_y=80, dimensions='20x20 sq ft', price=1500),
                Stall(name='E2', size='large', location_x=10, location_y=120, dimensions='20x20 sq ft', price=1500),
                Stall(name='F1', size='large', location_x=50, location_y=120, dimensions='20x20 sq ft', price=1500),
            ]
            db.session.add_all(stalls)
            db.session.commit()
            print(f"✓ Added {len(stalls)} stalls")
        
        # Add sample genres if not exists
        if Genre.query.count() == 0:
            genres = [
                Genre(name='Fiction', description='Novels and short stories', icon='📖'),
                Genre(name='Non-Fiction', description='Educational and factual books', icon='📚'),
                Genre(name='Self-Help', description='Personal development books', icon='🌟'),
                Genre(name='Children', description='Books for children', icon='👶'),
                Genre(name='Science', description='Science and technology books', icon='🔬'),
                Genre(name='History', description='Historical books', icon='🏛️'),
                Genre(name='Biography', description='Life stories and memoirs', icon='👤'),
                Genre(name='Poetry', description='Poetry and verse', icon='✍️'),
                Genre(name='Art & Design', description='Art and design books', icon='🎨'),
                Genre(name='Business', description='Business and economics', icon='💼'),
            ]
            db.session.add_all(genres)
            db.session.commit()
            print(f"✓ Added {len(genres)} genres")
        
        # Add sample admin employee if not exists
        if Employee.query.count() == 0:
            admin = Employee(
                username='admin',
                email='admin@bookfair.lk',
                full_name='Admin User',
                role='admin'
            )
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
            print("✓ Added admin employee")
        
        print("\n✓ Database initialized successfully!")

if __name__ == '__main__':
    init_db()

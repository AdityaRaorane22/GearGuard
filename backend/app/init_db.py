"""
Database initialization script

This script will:
1. Create the database if it doesn't exist
2. Create all tables
3. Optionally create an admin user
"""

from sqlalchemy import create_engine, text
from sqlalchemy.exc import ProgrammingError
from sqlalchemy_utils import database_exists, create_database
from .database import Base, engine
from .models.user import User, UserRole
from .utils.security import hash_password
from .database import SessionLocal
from .config import settings


def init_database():
    """Initialize the database and create all tables"""
    
    print("🔧 Initializing database...")
    
    # Create database if it doesn't exist
    if not database_exists(engine.url):
        print(f"📦 Creating database: {engine.url.database}")
        create_database(engine.url)
        print("✅ Database created successfully!")
    else:
        print(f"✅ Database '{engine.url.database}' already exists")
    
    # Create all tables
    print("📋 Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ All tables created successfully!")
    
    print("\n🎉 Database initialization complete!")


def create_admin_user(name: str, email: str, password: str):
    """
    Create an admin user for testing
    
    Args:
        name: Admin's full name
        email: Admin's email
        password: Admin's password
    """
    db = SessionLocal()
    
    try:
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.email == email).first()
        
        if existing_admin:
            print(f"⚠️  Admin user '{email}' already exists. Skipping.")
            return
        
        # Create admin user
        admin_user = User(
            name=name,
            email=email,
            password_hash=hash_password(password),
            role=UserRole.ADMIN
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print(f"✅ Admin user created successfully!")
        print(f"   Email: {email}")
        print(f"   Password: {password}")
        print(f"   Role: {admin_user.role}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating admin user: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    import sys
    
    # Initialize database
    init_database()
    
    # Check if we should create an admin user
    if len(sys.argv) > 1 and sys.argv[1] == "--create-admin":
        print("\n👤 Creating admin user...")
        
        # Get admin details from command line or use defaults
        admin_name = input("Admin Name (default: Admin User): ").strip() or "Admin User"
        admin_email = input("Admin Email (default: admin@gearguard.com): ").strip() or "admin@gearguard.com"
        admin_password = input("Admin Password (default: Admin123): ").strip() or "Admin123"
        
        create_admin_user(admin_name, admin_email, admin_password)
    
    print("\n✨ Setup complete! You can now run the application.")

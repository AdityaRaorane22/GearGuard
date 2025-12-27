"""
Update user role to Admin
Run this script to make your user an admin so you can access the dashboard
"""
from app.database import SessionLocal
from app.models import User, UserRole

db = SessionLocal()

# Get user by email - replace with your email
email = input("Enter your email: ")
user = db.query(User).filter(User.email == email).first()

if user:
    print(f"Found user: {user.name} ({user.email})")
    print(f"Current role: {user.role}")
    
    user.role = UserRole.ADMIN
    db.commit()
    
    print(f"✅ Updated role to: {user.role}")
else:
    print(f"❌ User not found with email: {email}")

db.close()

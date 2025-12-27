from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.sql import func
from ..database import Base
import enum


class UserRole(str, enum.Enum):
    """User role enumeration"""
    USER = "User"
    TECHNICIAN = "Technician"
    MANAGER = "Manager"
    ADMIN = "Admin"


class User(Base):
    """User model for authentication and authorization"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.USER)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"

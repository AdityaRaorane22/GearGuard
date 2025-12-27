from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from ..models.user import UserRole


class SignupRequest(BaseModel):
    """Schema for user signup request"""
    name: str
    email: EmailStr
    password: str
    confirm_password: str
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Name cannot be empty')
        return v.strip()
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v


class LoginRequest(BaseModel):
    """Schema for user login request"""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Schema for authentication token response"""
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """Schema for user information response"""
    id: int
    name: str
    email: str
    role: UserRole
    
    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    """Schema for login response with token and user info"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

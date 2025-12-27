from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from models import RoleEnum


class UserBase(BaseModel):
    """Base user schema with common fields."""
    email: EmailStr = Field(..., description="User email address")
    username: str = Field(..., min_length=3, max_length=50, description="Username")
    full_name: Optional[str] = Field(None, max_length=255, description="Full name")
    role: RoleEnum = Field(default=RoleEnum.USER, description="User role")


class UserCreate(UserBase):
    """Schema for creating a new user."""
    password: str = Field(..., min_length=8, max_length=255, description="Password (min 8 characters)")


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class UserResponse(UserBase):
    """Schema for user response (read operations)."""
    id: UUID = Field(..., description="User unique identifier")
    is_active: bool = Field(..., description="Whether the user is active")
    created_at: datetime = Field(..., description="Account creation timestamp")

    class Config:
        from_attributes = True


class Token(BaseModel):
    """Schema for JWT token response."""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")


class TokenData(BaseModel):
    """Schema for JWT token payload data."""
    email: Optional[EmailStr] = Field(None, description="User email from token")

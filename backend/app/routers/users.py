from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.user import User, UserRole
from ..schemas.auth import UserResponse
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=List[UserResponse])
def list_users(
    role: Optional[UserRole] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all users, optionally filtered by role"""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.all()

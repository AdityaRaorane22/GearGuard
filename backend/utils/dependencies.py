from typing import Optional, List
from functools import wraps

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import get_db
from models import User, RoleEnum
from schemas import TokenData
from utils.security import decode_token, get_token_email

# OAuth2 scheme for JWT token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Dependency to get the current authenticated user from JWT token.
    
    Args:
        token: JWT token from Authorization header
        db: Database session
    
    Returns:
        The authenticated User object
    
    Raises:
        HTTPException: 401 Unauthorized if token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Decode token and get email
    email = get_token_email(token)
    if email is None:
        raise credentials_exception
    
    token_data = TokenData(email=email)
    
    # Query user from database
    result = await db.execute(
        select(User).where(User.email == token_data.email)
    )
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Dependency to get the current active user.
    Extends get_current_user to also check if user account is active.
    
    Args:
        current_user: The current authenticated user
    
    Returns:
        The authenticated and active User object
    
    Raises:
        HTTPException: 400 Bad Request if user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )
    return current_user


def check_user_role(allowed_roles: List[RoleEnum]):
    """
    Dependency factory to check if user has one of the allowed roles.
    Use this as a dependency in route handlers for role-based access control.
    
    Args:
        allowed_roles: List of RoleEnum values that are allowed to access the route
    
    Returns:
        Async function that can be used as a dependency
    
    Example:
        @app.get("/admin/users")
        async def get_all_users(
            current_user: User = Depends(check_user_role([RoleEnum.ADMIN]))
        ):
            pass
    """
    async def role_checker(
        current_user: User = Depends(get_current_active_user),
    ) -> User:
        """Check if current user has one of the allowed roles."""
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User role '{current_user.role.value}' is not authorized. "
                       f"Required roles: {', '.join([r.value for r in allowed_roles])}",
            )
        return current_user
    
    return role_checker


# Common role checking dependencies
async def get_admin_user(
    current_user: User = Depends(check_user_role([RoleEnum.ADMIN])),
) -> User:
    """Dependency that requires user to be an admin."""
    return current_user


async def get_manager_or_admin_user(
    current_user: User = Depends(check_user_role([RoleEnum.ADMIN, RoleEnum.MANAGER])),
) -> User:
    """Dependency that requires user to be a manager or admin."""
    return current_user


async def get_technician_or_higher_user(
    current_user: User = Depends(
        check_user_role([RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.TECHNICIAN])
    ),
) -> User:
    """Dependency that requires user to be a technician, manager, or admin."""
    return current_user

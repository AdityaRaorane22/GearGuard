from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import get_db
from models import User, RoleEnum
from schemas import UserCreate, UserLogin, UserResponse, Token
from utils.security import get_password_hash, verify_password, create_access_token
from utils.dependencies import get_current_active_user

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["authentication"],
)


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """
    Register a new user account.
    
    Args:
        user_data: User registration data (email, username, password, full_name, role)
        db: Database session
    
    Returns:
        UserResponse with created user details
    
    Raises:
        HTTPException: 400 if email or username already exists
    """
    # Check if email already exists
    email_result = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    if email_result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Check if username already exists
    username_result = await db.execute(
        select(User).where(User.username == user_data.username)
    )
    if username_result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )
    
    # Hash the password
    hashed_password = get_password_hash(user_data.password)
    
    # Create new user with default role 'user'
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        role=RoleEnum.USER,  # Default role
        is_active=True,
    )
    
    # Save to database
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return UserResponse.model_validate(new_user)


@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db),
) -> Token:
    """
    Authenticate user and return JWT access token.
    
    Args:
        credentials: Login credentials (email, password)
        db: Database session
    
    Returns:
        Token with access_token and token_type
    
    Raises:
        HTTPException: 401 if email not found or password is incorrect
    """
    # Find user by email
    result = await db.execute(
        select(User).where(User.email == credentials.email)
    )
    user = result.scalar_one_or_none()
    
    # Check if user exists and password is correct
    if user is None or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": user.email})
    
    return Token(access_token=access_token, token_type="bearer")


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
) -> UserResponse:
    """
    Get current authenticated user's profile information.
    
    Args:
        current_user: Current authenticated and active user
    
    Returns:
        UserResponse with current user details
    """
    return UserResponse.model_validate(current_user)

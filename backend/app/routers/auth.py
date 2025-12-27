from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User, UserRole
from ..schemas.auth import SignupRequest, LoginRequest, LoginResponse, UserResponse
from ..utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    validate_password_complexity,
    validate_email_format
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(request: SignupRequest, db: Session = Depends(get_db)):
    """
    Register a new user account
    
    - Validates email format and uniqueness
    - Validates password complexity
    - Ensures password and confirm_password match
    - Hashes password before storage
    - Assigns default role as 'User'
    """
    # Validate email format
    if not validate_email_format(request.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format"
        )
    
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate password complexity
    is_valid, error_message = validate_password_complexity(request.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )
    
    # Verify passwords match
    if request.password != request.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )
    
    # Hash password
    password_hash = hash_password(request.password)
    
    # Create new user
    new_user = User(
        name=request.name,
        email=request.email,
        password_hash=password_hash,
        role=UserRole.USER  # Default role
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user and return JWT token
    
    - Verifies email exists
    - Verifies password is correct
    - Generates JWT access token
    - Returns token and user information
    """
    # Find user by email
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return LoginResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_info(db: Session = Depends(get_db)):
    """
    Get current authenticated user information
    This endpoint can be used to verify token validity
    """
    from ..utils.dependencies import get_current_user
    current_user = Depends(get_current_user)
    return current_user

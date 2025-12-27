from datetime import datetime
from enum import Enum
from uuid import uuid4

from sqlalchemy import Boolean, Column, DateTime, Enum as SQLEnum, String, Table, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from database import Base


class RoleEnum(str, Enum):
    """User role enumeration."""
    ADMIN = "admin"
    MANAGER = "manager"
    TECHNICIAN = "technician"
    USER = "user"


# Association table for many-to-many relationship between User and MaintenanceTeam
user_maintenance_team = Table(
    "user_maintenance_team",
    Base.metadata,
    Column("user_id", UUID(as_uuid=True), ForeignKey("user.id", ondelete="CASCADE"), primary_key=True),
    Column("maintenance_team_id", UUID(as_uuid=True), ForeignKey("maintenance_team.id", ondelete="CASCADE"), primary_key=True),
)


class User(Base):
    """
    User model representing application users.
    
    Attributes:
        id: Unique identifier (UUID)
        email: User email address (unique, indexed)
        username: User login name (unique)
        hashed_password: Bcrypt hashed password
        full_name: User's full name
        role: User role (admin, manager, technician, user)
        is_active: Whether the user account is active
        created_at: Account creation timestamp
        updated_at: Last update timestamp
        maintenance_teams: Many-to-many relationship to maintenance teams
    """

    __tablename__ = "user"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        nullable=False,
    )

    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    username = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    hashed_password = Column(
        String(255),
        nullable=False,
    )

    full_name = Column(
        String(255),
        nullable=True,
    )

    role = Column(
        SQLEnum(RoleEnum),
        default=RoleEnum.USER,
        nullable=False,
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # Relationships
    maintenance_teams = relationship(
        "MaintenanceTeam",
        secondary=user_maintenance_team,
        back_populates="members",
        cascade="all, delete",
    )

    # Additional indexes for better query performance
    __table_args__ = (
        Index("idx_user_email", "email"),
        Index("idx_user_username", "username"),
        Index("idx_user_role", "role"),
        Index("idx_user_is_active", "is_active"),
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, username={self.username}, role={self.role})>"

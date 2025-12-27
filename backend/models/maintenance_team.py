from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, String, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from database import Base


class MaintenanceTeam(Base):
    """
    MaintenanceTeam model representing teams responsible for equipment maintenance.
    
    Attributes:
        id: Unique identifier (UUID)
        team_name: Name of the maintenance team (unique)
        specialization: Area of specialization (e.g., Mechanics, Electricians, IT Support)
        created_at: Team creation timestamp
        members: Many-to-many relationship to User model
        equipment: One-to-many relationship to Equipment model
        maintenance_requests: One-to-many relationship to MaintenanceRequest model
    """

    __tablename__ = "maintenance_team"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        nullable=False,
    )

    team_name = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    specialization = Column(
        String(255),
        nullable=True,
        index=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    # Relationships
    members = relationship(
        "User",
        secondary="user_maintenance_team",
        back_populates="maintenance_teams",
        cascade="all, delete",
    )

    equipment = relationship(
        "Equipment",
        back_populates="maintenance_team",
        cascade="all, delete-orphan",
    )

    maintenance_requests = relationship(
        "MaintenanceRequest",
        back_populates="maintenance_team",
        cascade="all, delete-orphan",
    )

    # Additional indexes for better query performance
    __table_args__ = (
        Index("idx_maintenance_team_name", "team_name"),
        Index("idx_maintenance_team_specialization", "specialization"),
    )

    def __repr__(self) -> str:
        return f"<MaintenanceTeam(id={self.id}, name={self.team_name}, specialization={self.specialization})>"

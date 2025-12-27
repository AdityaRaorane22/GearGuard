from datetime import datetime
from enum import Enum
from uuid import uuid4

from sqlalchemy import Column, DateTime, Enum as SQLEnum, String, Float, ForeignKey, Index, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from database import Base


class RequestTypeEnum(str, Enum):
    """Maintenance request type enumeration."""
    CORRECTIVE = "corrective"
    PREVENTIVE = "preventive"


class StageEnum(str, Enum):
    """Maintenance request stage enumeration."""
    NEW = "new"
    IN_PROGRESS = "in_progress"
    REPAIRED = "repaired"
    SCRAP = "scrap"


class MaintenanceRequest(Base):
    """
    MaintenanceRequest model representing maintenance tasks for equipment.
    
    Attributes:
        id: Unique identifier (UUID)
        subject: Brief subject of the maintenance request
        description: Detailed description of the issue
        request_type: Type of maintenance (corrective, preventive)
        stage: Current stage of the request (new, in_progress, repaired, scrap)
        equipment_id: UUID of the equipment requiring maintenance
        maintenance_team_id: UUID of the assigned maintenance team
        assigned_technician_id: UUID of the assigned technician (nullable)
        scheduled_date: Scheduled date for maintenance (nullable)
        duration_hours: Estimated duration in hours (nullable)
        created_by_id: UUID of the user who created the request
        created_at: Request creation timestamp
        updated_at: Last update timestamp
        equipment: Relationship to Equipment model
        maintenance_team: Relationship to MaintenanceTeam model
        assigned_technician: Relationship to User model (technician)
        created_by: Relationship to User model (creator)
    """

    __tablename__ = "maintenance_request"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        nullable=False,
    )

    subject = Column(
        String(255),
        nullable=False,
        index=True,
    )

    description = Column(
        Text,
        nullable=True,
    )

    request_type = Column(
        SQLEnum(RequestTypeEnum),
        nullable=False,
        index=True,
    )

    stage = Column(
        SQLEnum(StageEnum),
        default=StageEnum.NEW,
        nullable=False,
        index=True,
    )

    equipment_id = Column(
        UUID(as_uuid=True),
        ForeignKey("equipment.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    maintenance_team_id = Column(
        UUID(as_uuid=True),
        ForeignKey("maintenance_team.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    assigned_technician_id = Column(
        UUID(as_uuid=True),
        ForeignKey("user.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    scheduled_date = Column(
        DateTime,
        nullable=True,
    )

    duration_hours = Column(
        Float,
        nullable=True,
    )

    created_by_id = Column(
        UUID(as_uuid=True),
        ForeignKey("user.id", ondelete="SET NULL"),
        nullable=False,
        index=True,
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
    equipment = relationship(
        "Equipment",
        foreign_keys=[equipment_id],
        back_populates="maintenance_requests",
    )

    maintenance_team = relationship(
        "MaintenanceTeam",
        foreign_keys=[maintenance_team_id],
        back_populates="maintenance_requests",
    )

    assigned_technician = relationship(
        "User",
        foreign_keys=[assigned_technician_id],
        backref="assigned_maintenance_requests",
    )

    created_by = relationship(
        "User",
        foreign_keys=[created_by_id],
        backref="created_maintenance_requests",
    )

    # Additional indexes for better query performance
    __table_args__ = (
        Index("idx_maintenance_request_subject", "subject"),
        Index("idx_maintenance_request_type", "request_type"),
        Index("idx_maintenance_request_stage", "stage"),
        Index("idx_maintenance_request_equipment_id", "equipment_id"),
        Index("idx_maintenance_request_team_id", "maintenance_team_id"),
        Index("idx_maintenance_request_technician_id", "assigned_technician_id"),
        Index("idx_maintenance_request_created_by_id", "created_by_id"),
    )

    def __repr__(self) -> str:
        return f"<MaintenanceRequest(id={self.id}, subject={self.subject}, stage={self.stage}, type={self.request_type})>"

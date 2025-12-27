from datetime import datetime
from enum import Enum
from uuid import uuid4

from sqlalchemy import Boolean, Column, DateTime, Enum as SQLEnum, String, Date, ForeignKey, Index, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from database import Base


class CategoryEnum(str, Enum):
    """Equipment category enumeration."""
    MACHINE = "machine"
    VEHICLE = "vehicle"
    COMPUTER = "computer"
    OTHER = "other"


class Equipment(Base):
    """
    Equipment model representing assets that require maintenance.
    
    Attributes:
        id: Unique identifier (UUID)
        equipment_name: Name of the equipment
        serial_number: Unique serial number (indexed)
        category: Equipment category (machine, vehicle, computer, other)
        department: Department responsible for the equipment
        assigned_employee_id: UUID of assigned employee (User)
        maintenance_team_id: UUID of assigned maintenance team
        purchase_date: Equipment purchase date
        warranty_expiry: Warranty expiration date
        location: Physical location of equipment
        is_scrapped: Whether equipment has been scrapped
        created_at: Record creation timestamp
        updated_at: Last update timestamp
        assigned_employee: Relationship to User model
        maintenance_team: Relationship to MaintenanceTeam model
        maintenance_requests: Relationship to MaintenanceRequest model
    """

    __tablename__ = "equipment"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        nullable=False,
    )

    equipment_name = Column(
        String(255),
        nullable=False,
        index=True,
    )

    serial_number = Column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )

    category = Column(
        SQLEnum(CategoryEnum),
        nullable=False,
        index=True,
    )

    department = Column(
        String(100),
        nullable=True,
        index=True,
    )

    assigned_employee_id = Column(
        UUID(as_uuid=True),
        ForeignKey("user.id", ondelete="SET NULL"),
        nullable=True,
    )

    maintenance_team_id = Column(
        UUID(as_uuid=True),
        ForeignKey("maintenance_team.id", ondelete="SET NULL"),
        nullable=True,
    )

    purchase_date = Column(
        Date,
        nullable=True,
    )

    warranty_expiry = Column(
        Date,
        nullable=True,
    )

    location = Column(
        String(255),
        nullable=True,
    )

    is_scrapped = Column(
        Boolean,
        default=False,
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
    assigned_employee = relationship(
        "User",
        foreign_keys=[assigned_employee_id],
        backref="assigned_equipment",
    )

    maintenance_team = relationship(
        "MaintenanceTeam",
        foreign_keys=[maintenance_team_id],
        backref="equipment",
    )

    maintenance_requests = relationship(
        "MaintenanceRequest",
        back_populates="equipment",
        cascade="all, delete-orphan",
    )

    # Additional indexes for better query performance
    __table_args__ = (
        Index("idx_equipment_serial_number", "serial_number"),
        Index("idx_equipment_category", "category"),
        Index("idx_equipment_department", "department"),
        Index("idx_equipment_is_scrapped", "is_scrapped"),
        Index("idx_equipment_assigned_employee_id", "assigned_employee_id"),
        Index("idx_equipment_maintenance_team_id", "maintenance_team_id"),
    )

    def __repr__(self) -> str:
        return f"<Equipment(id={self.id}, name={self.equipment_name}, serial={self.serial_number}, category={self.category})>"

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base
import enum


class RequestStatus(str, enum.Enum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    REPAIRED = "repaired"
    SCRAP = "scrap"


class RequestCategory(str, enum.Enum):
    CORRECTIVE = "corrective"
    PREVENTIVE = "preventive"


class RequestPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class MaintenanceRequest(Base):
    __tablename__ = "maintenance_requests"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String, nullable=False, index=True)
    description = Column(String)
    category = Column(SQLEnum(RequestCategory), nullable=False)
    status = Column(SQLEnum(RequestStatus), default=RequestStatus.NEW)
    priority = Column(SQLEnum(RequestPriority), default=RequestPriority.MEDIUM)
    
    # Foreign keys
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=False)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    technician_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Dates
    scheduled_date = Column(DateTime, nullable=True)
    completion_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Company/Department
    company = Column(String, default="Adani Enterprises")
    
    # Relationships
    equipment = relationship("Equipment", back_populates="maintenance_requests")
    requester = relationship("User", foreign_keys=[requester_id], backref="created_requests")
    technician = relationship("User", foreign_keys=[technician_id], backref="assigned_requests")

    @property
    def is_overdue(self) -> bool:
        """Check if request is overdue"""
        if self.scheduled_date and self.status != RequestStatus.REPAIRED:
            return datetime.utcnow() > self.scheduled_date
        return False

    def __repr__(self):
        return f"<MaintenanceRequest(subject={self.subject}, status={self.status})>"

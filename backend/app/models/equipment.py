from sqlalchemy import Column, Integer, String, Boolean, Enum as SQLEnum, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base
import enum


class EquipmentCategory(str, enum.Enum):
    MACHINERY = "machinery"
    VEHICLE = "vehicle"
    TOOL = "tool"
    ELECTRONIC = "electronic"
    OTHER = "other"


class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    serial_number = Column(String, unique=True, nullable=False)
    category = Column(SQLEnum(EquipmentCategory), nullable=False)
    department = Column(String, nullable=False)
    company = Column(String, default="Adani Enterprises")
    maintenance_team = Column(String, nullable=True) # Deprecated, use maintenance_team_id
    maintenance_team_id = Column(Integer, ForeignKey("maintenance_teams.id"), nullable=True)
    assigned_employee_id = Column(Integer, nullable=True)
    default_technician_id = Column(Integer, nullable=True)
    work_center = Column(String, nullable=True)
    location = Column(String, nullable=True)
    description = Column(String, nullable=True)
    assigned_date = Column(DateTime, nullable=True)
    scrap_date = Column(DateTime, nullable=True)
    is_critical = Column(Boolean, default=False)
    health_score = Column(Integer, default=100)  # 0-100
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship to maintenance requests
    maintenance_requests = relationship("MaintenanceRequest", back_populates="equipment")
    maintenance_team_rel = relationship("MaintenanceTeam", back_populates="equipment")

    def __repr__(self):
        return f"<Equipment(name={self.name}, serial_number={self.serial_number})>"

from sqlalchemy import Column, Integer, String, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
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
    is_critical = Column(Boolean, default=False)
    health_score = Column(Integer, default=100)  # 0-100
    
    # Relationship to maintenance requests
    maintenance_requests = relationship("MaintenanceRequest", back_populates="equipment")

    def __repr__(self):
        return f"<Equipment(name={self.name}, serial_number={self.serial_number})>"

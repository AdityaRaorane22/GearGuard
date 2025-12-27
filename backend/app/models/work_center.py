from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class WorkCenter(Base):
    __tablename__ = "work_centers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    code = Column(String, unique=True, nullable=False, index=True)
    tags = Column(JSON, nullable=True)  # Store tags as JSON array
    alternative_work_centers = Column(JSON, nullable=True)  # Store IDs of alternative WCs
    
    # Performance & Cost metrics
    cost_per_hour = Column(Float, default=0.0)
    capacity = Column(Integer, default=0)
    time_efficiency = Column(Float, default=100.0)
    oee_target = Column(Float, default=85.0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to maintenance requests
    maintenance_requests = relationship("MaintenanceRequest", back_populates="work_center")

    def __repr__(self):
        return f"<WorkCenter(name={self.name}, code={self.code})>"

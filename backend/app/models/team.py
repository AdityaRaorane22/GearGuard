from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

# Association table for Team Members (User <-> Team)
team_members = Table(
    'team_members',
    Base.metadata,
    Column('team_id', Integer, ForeignKey('maintenance_teams.id'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True)
)

class MaintenanceTeam(Base):
    __tablename__ = "maintenance_teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    company = Column(String, default="Adani Enterprises")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    members = relationship("User", secondary=team_members, backref="teams")
    equipment = relationship("Equipment", back_populates="maintenance_team_rel")

    def __repr__(self):
        return f"<MaintenanceTeam(name={self.name})>"

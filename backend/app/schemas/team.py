from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from .auth import UserResponse

class MaintenanceTeamBase(BaseModel):
    name: str
    company: str = "Adani Enterprises"

class MaintenanceTeamCreate(MaintenanceTeamBase):
    member_ids: List[int] = []

class MaintenanceTeamUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    member_ids: Optional[List[int]] = None

class MaintenanceTeamResponse(MaintenanceTeamBase):
    id: int
    created_at: datetime
    updated_at: datetime
    members: List[UserResponse] = []

    class Config:
        from_attributes = True

class MaintenanceTeamListResponse(BaseModel):
    items: List[MaintenanceTeamResponse]
    total: int

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from ..models.maintenance_request import RequestCategory, RequestStatus, RequestPriority


class MaintenanceRequestBase(BaseModel):
    subject: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    category: RequestCategory
    priority: RequestPriority
    equipment_id: int
    technician_id: Optional[int] = None
    maintenance_team_id: Optional[int] = None
    scheduled_date: Optional[str] = None  # Accept as string from frontend
    duration: Optional[float] = None  # Duration in hours


class MaintenanceRequestCreate(MaintenanceRequestBase):
    """Schema for creating a maintenance request"""
    pass


class MaintenanceRequestUpdate(BaseModel):
    """Schema for updating a maintenance request - all fields optional"""
    subject: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    category: Optional[RequestCategory] = None
    status: Optional[RequestStatus] = None
    priority: Optional[RequestPriority] = None
    priority: Optional[RequestPriority] = None
    technician_id: Optional[int] = None
    maintenance_team_id: Optional[int] = None
    scheduled_date: Optional[datetime] = None
    completion_date: Optional[datetime] = None


class MaintenanceRequestResponse(BaseModel):
    """Schema for maintenance request response"""
    id: int
    subject: str
    description: Optional[str] = None
    category: RequestCategory
    priority: RequestPriority
    equipment_id: int
    requester_id: int
    requester_id: int
    technician_id: Optional[int] = None
    maintenance_team_id: Optional[int] = None
    status: RequestStatus
    scheduled_date: Optional[datetime] = None
    completion_date: Optional[datetime] = None
    duration: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    company: str

    class Config:
        from_attributes = True

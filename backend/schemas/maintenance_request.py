from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, computed_field

from models import RequestTypeEnum, StageEnum
from schemas.user import UserResponse
from schemas.equipment import EquipmentResponse


class MaintenanceRequestBase(BaseModel):
    """Base maintenance request schema."""
    subject: str = Field(..., max_length=255, description="Request subject")
    description: Optional[str] = Field(None, description="Detailed description")
    request_type: RequestTypeEnum = Field(..., description="Request type (corrective/preventive)")
    scheduled_date: Optional[datetime] = Field(None, description="Scheduled maintenance date")


class MaintenanceRequestCreate(MaintenanceRequestBase):
    """Schema for creating a maintenance request."""
    equipment_id: UUID = Field(..., description="Equipment ID requiring maintenance")
    maintenance_team_id: Optional[UUID] = Field(None, description="Maintenance team ID")


class MaintenanceRequestUpdate(BaseModel):
    """Schema for updating a maintenance request (all fields optional)."""
    stage: Optional[StageEnum] = Field(None, description="Request stage")
    assigned_technician_id: Optional[UUID] = Field(None, description="Assigned technician ID")
    duration_hours: Optional[float] = Field(None, gt=0, description="Duration in hours")
    scheduled_date: Optional[datetime] = Field(None, description="Scheduled maintenance date")
    subject: Optional[str] = Field(None, max_length=255, description="Request subject")
    description: Optional[str] = Field(None, description="Detailed description")
    request_type: Optional[RequestTypeEnum] = Field(None, description="Request type")
    maintenance_team_id: Optional[UUID] = Field(None, description="Maintenance team ID")


class MaintenanceRequestResponse(MaintenanceRequestBase):
    """Schema for maintenance request response (read operations)."""
    id: UUID = Field(..., description="Request unique identifier")
    stage: StageEnum = Field(..., description="Current stage")
    equipment_id: UUID = Field(..., description="Equipment ID")
    maintenance_team_id: Optional[UUID] = Field(None, description="Maintenance team ID")
    assigned_technician_id: Optional[UUID] = Field(None, description="Assigned technician ID")
    duration_hours: Optional[float] = Field(None, description="Duration in hours")
    created_by_id: UUID = Field(..., description="Created by user ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    
    # Nested relationships
    equipment: Optional[EquipmentResponse] = Field(None, description="Equipment details")
    assigned_technician: Optional[UserResponse] = Field(None, description="Assigned technician details")
    created_by: Optional[UserResponse] = Field(None, description="Created by user details")

    @computed_field
    @property
    def is_overdue(self) -> bool:
        """
        Compute whether the maintenance request is overdue.
        Returns True if scheduled_date has passed and request is not in completed stage.
        """
        if not self.scheduled_date:
            return False
        
        if self.stage in (StageEnum.REPAIRED, StageEnum.SCRAP):
            return False
        
        return datetime.utcnow() > self.scheduled_date

    class Config:
        from_attributes = True

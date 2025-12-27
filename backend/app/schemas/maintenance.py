from pydantic import BaseModel, Field, root_validator
from datetime import datetime
from typing import Optional
from ..models.maintenance_request import RequestCategory, RequestStatus, RequestPriority, MaintenanceTargetType


class MaintenanceRequestBase(BaseModel):
    subject: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    category: RequestCategory
    priority: RequestPriority
    
    # Target fields
    target_type: MaintenanceTargetType = MaintenanceTargetType.EQUIPMENT
    equipment_id: Optional[int] = None
    work_center_name: Optional[str] = None
    
    technician_id: Optional[int] = None
    maintenance_team_id: Optional[int] = None
    scheduled_date: Optional[str] = None  # Accept as string from frontend
    duration: Optional[float] = None  # Duration in hours

    @root_validator(pre=True)
    def validate_target(cls, values):
        target_type = values.get('target_type')
        equipment_id = values.get('equipment_id')
        work_center_name = values.get('work_center_name')
        
        # Default to equipment if not specified
        if not target_type:
            target_type = MaintenanceTargetType.EQUIPMENT
            values['target_type'] = target_type

        if target_type == MaintenanceTargetType.EQUIPMENT:
            if not equipment_id:
                raise ValueError("equipment_id is required when target_type is EQUIPMENT")
            if work_center_name:
                raise ValueError("work_center_name must not be set when target_type is EQUIPMENT")
        
        elif target_type == MaintenanceTargetType.WORK_CENTER:
            if not work_center_name:
                raise ValueError("work_center_name is required when target_type is WORK_CENTER")
            if equipment_id:
                raise ValueError("equipment_id must not be set when target_type is WORK_CENTER")
                
        return values


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
    
    target_type: MaintenanceTargetType
    equipment_id: Optional[int] = None
    work_center_id: Optional[int] = None
    
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

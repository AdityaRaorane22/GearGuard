from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from models import CategoryEnum
from schemas.user import UserResponse


class MaintenanceTeamBase(BaseModel):
    """Base maintenance team schema."""
    team_name: str = Field(..., description="Team name")
    specialization: Optional[str] = Field(None, description="Team specialization")


class MaintenanceTeamResponse(MaintenanceTeamBase):
    """Schema for maintenance team response."""
    id: UUID = Field(..., description="Team unique identifier")

    class Config:
        from_attributes = True


class EquipmentBase(BaseModel):
    """Base equipment schema with common fields."""
    equipment_name: str = Field(..., max_length=255, description="Equipment name")
    serial_number: str = Field(..., max_length=100, description="Serial number")
    category: CategoryEnum = Field(..., description="Equipment category")
    department: Optional[str] = Field(None, max_length=100, description="Department")
    purchase_date: Optional[date] = Field(None, description="Purchase date")
    warranty_expiry: Optional[date] = Field(None, description="Warranty expiry date")
    location: Optional[str] = Field(None, max_length=255, description="Physical location")
    is_scrapped: bool = Field(default=False, description="Whether equipment is scrapped")
    assigned_employee_id: Optional[UUID] = Field(None, description="Assigned employee ID")
    maintenance_team_id: Optional[UUID] = Field(None, description="Maintenance team ID")


class EquipmentCreate(EquipmentBase):
    """Schema for creating equipment."""
    pass


class EquipmentUpdate(BaseModel):
    """Schema for updating equipment (all fields optional)."""
    equipment_name: Optional[str] = Field(None, max_length=255, description="Equipment name")
    serial_number: Optional[str] = Field(None, max_length=100, description="Serial number")
    category: Optional[CategoryEnum] = Field(None, description="Equipment category")
    department: Optional[str] = Field(None, max_length=100, description="Department")
    purchase_date: Optional[date] = Field(None, description="Purchase date")
    warranty_expiry: Optional[date] = Field(None, description="Warranty expiry date")
    location: Optional[str] = Field(None, max_length=255, description="Physical location")
    is_scrapped: Optional[bool] = Field(None, description="Whether equipment is scrapped")
    assigned_employee_id: Optional[UUID] = Field(None, description="Assigned employee ID")
    maintenance_team_id: Optional[UUID] = Field(None, description="Maintenance team ID")


class EquipmentResponse(EquipmentBase):
    """Schema for equipment response (read operations)."""
    id: UUID = Field(..., description="Equipment unique identifier")
    created_at: datetime = Field(..., description="Creation timestamp")
    maintenance_requests_count: int = Field(
        default=0,
        description="Number of maintenance requests"
    )
    assigned_employee: Optional[UserResponse] = Field(None, description="Assigned employee details")
    maintenance_team: Optional[MaintenanceTeamResponse] = Field(None, description="Maintenance team details")

    class Config:
        from_attributes = True

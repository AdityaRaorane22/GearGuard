from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from ..models.equipment import EquipmentCategory


class EquipmentBase(BaseModel):
    name: str
    serial_number: str
    category: EquipmentCategory
    department: str
    company: str = "Adani Enterprises"
    maintenance_team: Optional[str] = None
    maintenance_team_id: Optional[int] = None
    assigned_employee_id: Optional[int] = None
    default_technician_id: Optional[int] = None
    work_center: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    assigned_date: Optional[str] = None  # Accept as string from frontend
    scrap_date: Optional[str] = None  # Accept as string from frontend
    is_critical: bool = False
    health_score: int = 100


class EquipmentCreate(EquipmentBase):
    """Schema for creating equipment"""
    pass


class EquipmentUpdate(BaseModel):
    """Schema for updating equipment - all fields optional"""
    name: Optional[str] = None
    serial_number: Optional[str] = None
    category: Optional[EquipmentCategory] = None
    department: Optional[str] = None
    company: Optional[str] = None
    maintenance_team: Optional[str] = None
    maintenance_team_id: Optional[int] = None
    assigned_employee_id: Optional[int] = None
    default_technician_id: Optional[int] = None
    work_center: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    assigned_date: Optional[str] = None
    scrap_date: Optional[str] = None
    is_critical: Optional[bool] = None
    health_score: Optional[int] = None


class EquipmentResponse(EquipmentBase):
    """Schema for equipment response"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EquipmentListResponse(BaseModel):
    """Schema for paginated equipment list"""
    items: list[EquipmentResponse]
    total: int
    page: int
    page_size: int

from pydantic import BaseModel
from typing import List
from datetime import datetime


class DashboardMetrics(BaseModel):
    critical_equipment: dict
    technician_load: dict
    open_requests: dict


class MaintenanceRequestSummary(BaseModel):
    id: int
    subject: str
    employee: str
    technician: str
    category: str
    status: str
    company: str
    scheduled_date: str | None
    is_overdue: bool

    class Config:
        from_attributes = True


class DashboardResponse(BaseModel):
    metrics: DashboardMetrics
    recent_requests: List[MaintenanceRequestSummary]

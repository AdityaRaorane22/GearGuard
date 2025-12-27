from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class WorkCenterBase(BaseModel):
    name: str
    code: str
    tags: Optional[List[str]] = []
    alternative_work_centers: Optional[List[int]] = []
    cost_per_hour: Optional[float] = 0.0
    capacity: Optional[int] = 0
    time_efficiency: Optional[float] = 100.0
    oee_target: Optional[float] = 85.0

class WorkCenterCreate(WorkCenterBase):
    pass

class WorkCenterUpdate(WorkCenterBase):
    name: Optional[str] = None
    code: Optional[str] = None

class WorkCenter(WorkCenterBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

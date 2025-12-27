from datetime import datetime
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from models import MaintenanceRequest, StageEnum
from schemas import MaintenanceRequestResponse


async def get_overdue_requests(db: AsyncSession) -> List[MaintenanceRequestResponse]:
    """
    Fetch maintenance requests that are overdue.
    Overdue = scheduled_date in the past AND stage not in (repaired, scrap).
    Includes equipment and technician relationships via selectinload.
    """
    query = (
        select(MaintenanceRequest)
        .where(MaintenanceRequest.scheduled_date.isnot(None))
        .where(MaintenanceRequest.scheduled_date < datetime.utcnow())
        .where(MaintenanceRequest.stage.notin_([StageEnum.REPAIRED, StageEnum.SCRAP]))
        .options(
            selectinload(MaintenanceRequest.equipment),
            selectinload(MaintenanceRequest.assigned_technician),
        )
    )

    result = await db.execute(query)
    requests = result.scalars().all()

    return [MaintenanceRequestResponse.model_validate(req) for req in requests]

from typing import Dict, Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, funcfrom models import MaintenanceRequest, Equipment, StageEnum, RequestTypeEnum, MaintenanceTeam
from utils.dependencies import get_manager_or_admin_user

router = APIRouter(
    prefix="/api/v1/dashboard",
    tags=["dashboard"],
)


@router.get("/stats")
async def dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_manager_or_admin_user),
) -> Dict[str, Any]:
    """
    Aggregate dashboard statistics.
    - Requests by stage
    - Requests by team
    - Overdue requests count (scheduled_date passed and not repaired/scrap)
    - Equipment by category
    """
    # Requests by stage
    stage_rows = (await db.execute(
        select(MaintenanceRequest.stage, func.count())
        .group_by(MaintenanceRequest.stage)
    )).all()
    requests_by_stage = {row[0].value: row[1] for row in stage_rows}

    # Requests by team
    team_rows = (await db.execute(
        select(MaintenanceRequest.maintenance_team_id, func.count())
        .group_by(MaintenanceRequest.maintenance_team_id)
    )).all()
    requests_by_team = {
        (str(row[0]) if row[0] is not None else "none"): row[1] for row in team_rows
    }

    # Overdue requests: scheduled_date in past and not repaired/scrap
    overdue_count = (await db.execute(
        select(func.count())
        .where(MaintenanceRequest.scheduled_date.isnot(None))
        .where(MaintenanceRequest.scheduled_date < func.now())
        .where(MaintenanceRequest.stage.notin_([StageEnum.REPAIRED, StageEnum.SCRAP]))
    )).scalar_one()

    # Equipment by category
    category_rows = (await db.execute(
        select(Equipment.category, func.count())
        .group_by(Equipment.category)
    )).all()
    equipment_by_category = {row[0].value if hasattr(row[0], 'value') else row[0]: row[1] for row in category_rows}

    return {
        "requests_by_stage": requests_by_stage,
        "requests_by_team": requests_by_team,
        "overdue_requests": overdue_count,
        "equipment_by_category": equipment_by_category,
    }

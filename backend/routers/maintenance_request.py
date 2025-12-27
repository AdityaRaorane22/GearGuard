from typing import Optional, List, Dict, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_

from database import get_db
from models import MaintenanceRequest, Equipment, MaintenanceTeam, StageEnum, RequestTypeEnum
from schemas import MaintenanceRequestCreate, MaintenanceRequestResponse
from utils.dependencies import get_current_active_user
from datetime import datetime

router = APIRouter(
    prefix="/api/v1/requests",
    tags=["maintenance_requests"],
)


@router.post("", response_model=MaintenanceRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_maintenance_request(
    request_data: MaintenanceRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user),
) -> MaintenanceRequestResponse:
    """
    Create a maintenance request for equipment.
    - Auto-fetch equipment and its maintenance team
    - Set stage to NEW
    - Set created_by to current user
    """
    # Validate equipment exists
    equipment_result = await db.execute(
        select(Equipment).where(Equipment.id == request_data.equipment_id)
    )
    equipment = equipment_result.scalar_one_or_none()
    if equipment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found",
        )

    # Derive maintenance team from equipment if not provided
    maintenance_team_id = request_data.maintenance_team_id or equipment.maintenance_team_id

    new_request = MaintenanceRequest(
        subject=request_data.subject,
        description=request_data.description,
        request_type=request_data.request_type,
        scheduled_date=request_data.scheduled_date,
        equipment_id=request_data.equipment_id,
        maintenance_team_id=maintenance_team_id,
        stage=StageEnum.NEW,
        created_by_id=current_user.id,
    )

    db.add(new_request)
    await db.commit()
    await db.refresh(new_request)

    return MaintenanceRequestResponse.model_validate(new_request)


@router.get("", response_model=List[MaintenanceRequestResponse])
async def list_maintenance_requests(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user),
    stage: Optional[str] = Query(None, description="Filter by stage"),
    team_id: Optional[UUID] = Query(None, description="Filter by maintenance team"),
    equipment_id: Optional[UUID] = Query(None, description="Filter by equipment"),
    request_type: Optional[str] = Query(None, description="Filter by request type"),
    group_by: Optional[str] = Query(None, description="Group by stage|team|equipment"),
) -> Any:
    """
    List maintenance requests with optional filtering and grouping.
    If group_by is provided, returns grouped data structures instead of flat list.
    """
    filters = []

    # Stage filter
    if stage:
        try:
            stage_enum = StageEnum(stage.lower())
            filters.append(MaintenanceRequest.stage == stage_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid stage. Allowed: {', '.join([s.value for s in StageEnum])}"
            )

    # Request type filter
    if request_type:
        try:
            rt_enum = RequestTypeEnum(request_type.lower())
            filters.append(MaintenanceRequest.request_type == rt_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid request_type. Allowed: {', '.join([r.value for r in RequestTypeEnum])}"
            )

    if team_id:
        filters.append(MaintenanceRequest.maintenance_team_id == team_id)

    if equipment_id:
        filters.append(MaintenanceRequest.equipment_id == equipment_id)

    where_clause = and_(*filters) if filters else True

    result = await db.execute(select(MaintenanceRequest).where(where_clause))
    items = list(result.scalars().all())

    # No grouping requested: return flat list
    if not group_by:
        return [MaintenanceRequestResponse.model_validate(item) for item in items]

    # Grouping logic
    group_key = group_by.lower()
    allowed_groups = {"stage", "team", "equipment"}
    if group_key not in allowed_groups:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid group_by. Allowed: {', '.join(sorted(allowed_groups))}"
        )

    grouped: Dict[str, List[MaintenanceRequestResponse]] = {}
    for item in items:
        if group_key == "stage":
            key = item.stage.value
        elif group_key == "team":
            key = str(item.maintenance_team_id) if item.maintenance_team_id else "none"
        else:  # equipment
            key = str(item.equipment_id)

        grouped.setdefault(key, []).append(MaintenanceRequestResponse.model_validate(item))

    # Build response list with metadata
    response_groups = [
        {
            "group": key,
            "count": len(values),
            "items": values,
        }
        for key, values in grouped.items()
    ]

    return response_groups


@router.get("/calendar", response_model=List[Dict[str, Any]])
async def calendar_view(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user),
    date_from: Optional[datetime] = Query(None, description="Start date (inclusive)"),
    date_to: Optional[datetime] = Query(None, description="End date (inclusive)"),
) -> List[Dict[str, Any]]:
    """
    Calendar view for preventive maintenance requests.
    - Filters by scheduled_date between date_from and date_to (inclusive) when provided
    - Includes only preventive requests with a scheduled_date
    - Groups results by date (YYYY-MM-DD)
    """
    filters = [
        MaintenanceRequest.request_type == RequestTypeEnum.PREVENTIVE,
        MaintenanceRequest.scheduled_date.isnot(None),
    ]

    if date_from:
        filters.append(MaintenanceRequest.scheduled_date >= date_from)
    if date_to:
        filters.append(MaintenanceRequest.scheduled_date <= date_to)

    where_clause = and_(*filters)

    result = await db.execute(
        select(MaintenanceRequest).where(where_clause)
    )
    items = result.scalars().all()

    grouped: Dict[str, List[MaintenanceRequestResponse]] = {}
    for item in items:
        date_key = item.scheduled_date.date().isoformat()
        grouped.setdefault(date_key, []).append(MaintenanceRequestResponse.model_validate(item))

    response = [
        {
            "date": date_key,
            "count": len(reqs),
            "items": reqs,
        }
        for date_key, reqs in sorted(grouped.items())
    ]

    return response


@router.patch("/{request_id}/complete", response_model=MaintenanceRequestResponse)
async def complete_request(
    request_id: UUID,
    duration_hours: float = Body(..., gt=0, description="Duration in hours"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user),
) -> MaintenanceRequestResponse:
    """
    Complete a maintenance request.
    - Sets stage to REPAIRED
    - Records duration_hours
    - Updates completion timestamp (updated_at)
    """
    result = await db.execute(
        select(MaintenanceRequest).where(MaintenanceRequest.id == request_id)
    )
    req_obj = result.scalar_one_or_none()
    if req_obj is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    if req_obj.stage in (StageEnum.REPAIRED, StageEnum.SCRAP):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request is already completed",
        )

    # Set completion data
    req_obj.stage = StageEnum.REPAIRED
    req_obj.duration_hours = duration_hours
    req_obj.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(req_obj)

    return MaintenanceRequestResponse.model_validate(req_obj)


@router.patch("/{request_id}/assign", response_model=MaintenanceRequestResponse)
async def assign_technician(
    request_id: UUID,
    technician_id: Optional[UUID] = Body(None, embed=True, description="Technician ID to assign; if omitted, assigns current user"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user),
) -> MaintenanceRequestResponse:
    """
    Assign a technician to a maintenance request.
    - If technician_id is omitted, assigns current user (self-assign).
    - Technician must belong to the request's maintenance team.
    - If current stage is NEW, it is advanced to IN_PROGRESS.
    """
    # Fetch request with team info
    result = await db.execute(
        select(MaintenanceRequest).where(MaintenanceRequest.id == request_id)
    )
    req_obj = result.scalar_one_or_none()
    if req_obj is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    if not req_obj.maintenance_team_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request has no maintenance team assigned",
        )

    # Determine target technician
    target_technician_id = technician_id or current_user.id

    # Load team members to verify membership
    team_result = await db.execute(
        select(MaintenanceTeam)
        .where(MaintenanceTeam.id == req_obj.maintenance_team_id)
        .options(selectinload(MaintenanceTeam.members))
    )
    team = team_result.scalar_one_or_none()
    if team is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance team not found")

    # Verify technician is in team
    member_ids = {member.id for member in team.members}
    if target_technician_id not in member_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Technician is not a member of the maintenance team",
        )

    # Prevent assignment if request already completed/closed
    if req_obj.stage in (StageEnum.REPAIRED, StageEnum.SCRAP):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign technician to a completed request",
        )

    # Assign technician
    req_obj.assigned_technician_id = target_technician_id

    # Auto-advance stage from NEW to IN_PROGRESS if applicable
    if req_obj.stage == StageEnum.NEW:
        req_obj.stage = StageEnum.IN_PROGRESS

    req_obj.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(req_obj)

    return MaintenanceRequestResponse.model_validate(req_obj)


@router.patch("/{request_id}/stage", response_model=MaintenanceRequestResponse)
async def update_request_stage(
    request_id: UUID,
    new_stage: str = Query(..., description="new | in_progress | repaired | scrap"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user),
) -> MaintenanceRequestResponse:
    """
    Update maintenance request stage with enforced transitions:
      new -> in_progress -> repaired | scrap

    If moved to scrap, the linked equipment is marked scrapped.
    Updates the request's updated_at timestamp.
    """
    # Fetch request
    result = await db.execute(
        select(MaintenanceRequest).where(MaintenanceRequest.id == request_id)
    )
    req_obj = result.scalar_one_or_none()
    if req_obj is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    # Parse target stage
    try:
        target_stage = StageEnum(new_stage.lower())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid stage. Allowed: {', '.join([s.value for s in StageEnum])}"
        )

    # Validate transition
    current_stage = req_obj.stage
    valid_transitions = {
        StageEnum.NEW: {StageEnum.IN_PROGRESS},
        StageEnum.IN_PROGRESS: {StageEnum.REPAIRED, StageEnum.SCRAP},
        StageEnum.REPAIRED: set(),
        StageEnum.SCRAP: set(),
    }
    if target_stage not in valid_transitions[current_stage]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid transition from {current_stage.value} to {target_stage.value}",
        )

    # Apply updates
    req_obj.stage = target_stage
    req_obj.updated_at = datetime.utcnow()

    # If scrapped, mark equipment as scrapped
    if target_stage == StageEnum.SCRAP:
        equip_result = await db.execute(
            select(Equipment).where(Equipment.id == req_obj.equipment_id)
        )
        equipment = equip_result.scalar_one_or_none()
        if equipment:
            equipment.is_scrapped = True
            equipment.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(req_obj)

    return MaintenanceRequestResponse.model_validate(req_obj)

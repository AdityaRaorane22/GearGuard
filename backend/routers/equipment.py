from typing import Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_

from database import get_db
from models import Equipment, MaintenanceTeam, User, MaintenanceRequest, StageEnum
from schemas import EquipmentCreate, EquipmentUpdate, EquipmentResponse
from schemas import EquipmentCreate, EquipmentUpdate, EquipmentResponse, MaintenanceRequestResponse
from utils.dependencies import get_manager_or_admin_user

router = APIRouter(
    prefix="/api/v1/equipment",
    tags=["equipment"],
)


@router.post("", response_model=EquipmentResponse, status_code=status.HTTP_201_CREATED)
async def create_equipment(
    equipment_data: EquipmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_manager_or_admin_user),
) -> EquipmentResponse:
    """
    Create a new equipment record.
    
    Requires manager or admin role.
    
    Args:
        equipment_data: Equipment creation data
        db: Database session
        current_user: Current authenticated user (manager/admin)
    
    Returns:
        EquipmentResponse with created equipment details
    
    Raises:
        HTTPException: 400 if serial number already exists
        HTTPException: 403 if user role is not manager/admin
        HTTPException: 404 if maintenance team not found
    """
    # Check if serial number already exists
    serial_result = await db.execute(
        select(Equipment).where(Equipment.serial_number == equipment_data.serial_number)
    )
    if serial_result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Equipment with this serial number already exists",
        )
    
    # Verify maintenance team exists if provided
    assigned_technician_id: Optional[UUID] = None
    if equipment_data.maintenance_team_id:
        team_result = await db.execute(
            select(MaintenanceTeam).where(
                MaintenanceTeam.id == equipment_data.maintenance_team_id
            )
        )
        team = team_result.scalar_one_or_none()
        
        if team is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Maintenance team not found",
            )
        
        # Auto-assign first member of the maintenance team as default technician
        if team.members:
            assigned_technician_id = team.members[0].id
    
    # Create new equipment
    new_equipment = Equipment(
        equipment_name=equipment_data.equipment_name,
        serial_number=equipment_data.serial_number,
        category=equipment_data.category,
        department=equipment_data.department,
        purchase_date=equipment_data.purchase_date,
        warranty_expiry=equipment_data.warranty_expiry,
        location=equipment_data.location,
        is_scrapped=equipment_data.is_scrapped,
        assigned_employee_id=equipment_data.assigned_employee_id,
        maintenance_team_id=equipment_data.maintenance_team_id,
    )
    
    # Save to database
    db.add(new_equipment)
    await db.commit()
    await db.refresh(new_equipment)
    
    return EquipmentResponse.model_validate(new_equipment)


@router.get("", response_model=List[EquipmentResponse])
async def list_equipment(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_manager_or_admin_user),
    department: Optional[str] = Query(None, description="Filter by department"),
    category: Optional[str] = Query(None, description="Filter by category"),
    assigned_employee_id: Optional[UUID] = Query(None, description="Filter by assigned employee"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, ge=1, le=100, description="Number of records to return"),
) -> List[EquipmentResponse]:
    """
    List equipment with optional filtering and pagination.
    
    Requires manager or admin role.
    
    Args:
        db: Database session
        current_user: Current authenticated user (manager/admin)
        department: Filter by department name (optional)
        category: Filter by category (optional)
        assigned_employee_id: Filter by assigned employee ID (optional)
        skip: Number of records to skip for pagination (default: 0)
        limit: Number of records to return (default: 10, max: 100)
    
    Returns:
        List of EquipmentResponse objects matching the filters
    """
    # Build dynamic where clause with optional filters
    filters = []
    
    if department:
        filters.append(Equipment.department == department)
    
    if category:
        filters.append(Equipment.category == category)
    
    if assigned_employee_id:
        filters.append(Equipment.assigned_employee_id == assigned_employee_id)
    
    # Combine filters with AND logic
    where_clause = and_(*filters) if filters else True
    
    # Query equipment with filters and pagination
    result = await db.execute(
        select(Equipment)
        .where(where_clause)
        .offset(skip)
        .limit(limit)
    )
    equipment_list = result.scalars().all()
    
    return [EquipmentResponse.model_validate(eq) for eq in equipment_list]


@router.get("/{equipment_id}", response_model=EquipmentResponse)
async def get_equipment(
    equipment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_manager_or_admin_user),
) -> EquipmentResponse:
    """
    Get detailed information about a specific equipment.
    
    Requires manager or admin role.
    
    Args:
        equipment_id: Equipment UUID
        db: Database session
        current_user: Current authenticated user (manager/admin)
    
    Returns:
        EquipmentResponse with all equipment details and relationships
    
    Raises:
        HTTPException: 404 if equipment not found
    """
    # Query equipment by ID
    result = await db.execute(
        select(Equipment).where(Equipment.id == equipment_id)
    )
    equipment = result.scalar_one_or_none()
    
    if equipment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found",
        )
    
    # Count open maintenance requests (not REPAIRED or SCRAP)
    open_requests = await db.execute(
        select(MaintenanceRequest).where(
            and_(
                MaintenanceRequest.equipment_id == equipment_id,
                MaintenanceRequest.stage.notin_([StageEnum.REPAIRED, StageEnum.SCRAP])
            )
        )
    )
    open_count = len(open_requests.scalars().all())
    
    # Convert to response (relationships are already loaded)
    response = EquipmentResponse.model_validate(equipment)
    # Note: maintenance_requests_count will be calculated from the model's count
    # If you want to override it with open count, you can do:
    # response.maintenance_requests_count = open_count
    
    return response


@router.patch("/{equipment_id}", response_model=EquipmentResponse)
async def update_equipment(
    equipment_id: UUID,
    equipment_data: EquipmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_manager_or_admin_user),
) -> EquipmentResponse:
    """
    Update equipment details (partial update).
    
    Requires manager or admin role.
    Only provided fields are updated; omitted fields are left unchanged.
    
    Args:
        equipment_id: Equipment UUID
        equipment_data: Equipment update data (all fields optional)
        db: Database session
        current_user: Current authenticated user (manager/admin)
    
    Returns:
        EquipmentResponse with updated equipment details
    
    Raises:
        HTTPException: 404 if equipment not found
        HTTPException: 400 if serial number already exists for another equipment
    """
    # Query equipment by ID
    result = await db.execute(
        select(Equipment).where(Equipment.id == equipment_id)
    )
    equipment = result.scalar_one_or_none()
    
    if equipment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found",
        )
    
    # If serial number is being updated, check for uniqueness
    if equipment_data.serial_number and equipment_data.serial_number != equipment.serial_number:
        serial_result = await db.execute(
            select(Equipment).where(
                and_(
                    Equipment.serial_number == equipment_data.serial_number,
                    Equipment.id != equipment_id
                )
            )
        )
        if serial_result.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Equipment with this serial number already exists",
            )
    
    # Update only provided fields
    update_data = equipment_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(equipment, field, value)
    
    # Save to database
    await db.commit()
    await db.refresh(equipment)
    
    return EquipmentResponse.model_validate(equipment)


@router.get("/{equipment_id}/maintenance-requests", response_model=List[MaintenanceRequestResponse])
async def get_equipment_maintenance_requests(
    equipment_id: UUID,
    response: Response,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_manager_or_admin_user),
    stage: Optional[str] = Query(None, description="Filter by maintenance request stage"),
) -> List[MaintenanceRequestResponse]:
    """
    Get all maintenance requests for a specific equipment.
    
    Requires manager or admin role.
    
    Args:
        equipment_id: Equipment UUID
        response: Response object to set headers
        db: Database session
        current_user: Current authenticated user (manager/admin)
        stage: Optional filter by request stage (new, in_progress, repaired, scrap)
    
    Returns:
        List of MaintenanceRequestResponse with status indicators
        Response headers include:
        - X-Total-Count: Total number of maintenance requests
        - X-Open-Count: Number of open requests (excluding repaired/scrap)
        - X-Overdue-Count: Number of overdue requests
    
    Raises:
        HTTPException: 404 if equipment not found
        HTTPException: 400 if invalid stage provided
    """
    # Verify equipment exists
    equipment_result = await db.execute(
        select(Equipment).where(Equipment.id == equipment_id)
    )
    equipment = equipment_result.scalar_one_or_none()
    
    if equipment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found",
        )
    
    # Build query for maintenance requests
    filters = [MaintenanceRequest.equipment_id == equipment_id]
    
    # Apply stage filter if provided
    if stage:
        try:
            stage_enum = StageEnum(stage.lower())
            filters.append(MaintenanceRequest.stage == stage_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid stage. Allowed values: {', '.join([s.value for s in StageEnum])}",
            )
    
    # Query all matching requests
    result = await db.execute(
        select(MaintenanceRequest).where(and_(*filters))
    )
    requests = result.scalars().all()
    
    # Count statistics
    total_count = len(requests)
    open_count = sum(
        1 for r in requests 
        if r.stage not in (StageEnum.REPAIRED, StageEnum.SCRAP)
    )
    overdue_count = sum(
        1 for r in requests
        if r.scheduled_date and 
        r.stage not in (StageEnum.REPAIRED, StageEnum.SCRAP) and
        r.scheduled_date < datetime.utcnow()
    )
    
    # Set response headers with counts
    response.headers["X-Total-Count"] = str(total_count)
    response.headers["X-Open-Count"] = str(open_count)
    response.headers["X-Overdue-Count"] = str(overdue_count)
    
    # Convert to response models
    return [MaintenanceRequestResponse.model_validate(req) for req in requests]

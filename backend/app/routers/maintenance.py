from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List

from ..database import get_db
from ..models import MaintenanceRequest, Equipment, User, RequestStatus, MaintenanceTargetType
from ..schemas.maintenance import (
    MaintenanceRequestCreate,
    MaintenanceRequestUpdate,
    MaintenanceRequestResponse
)
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])


class MaintenanceListResponse:
    """Response model for list endpoint"""
    items: List[MaintenanceRequestResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


@router.get("")
def list_maintenance_requests(
    equipment_id: Optional[int] = Query(None, description="Filter by equipment ID"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List maintenance requests with optional equipment filter and pagination
    """
    query = db.query(MaintenanceRequest)
    
    # Filter by equipment if provided
    if equipment_id:
        query = query.filter(MaintenanceRequest.equipment_id == equipment_id)
    
    # Count total
    total = query.count()
    
    # Paginate
    offset = (page - 1) * page_size
    requests = query.order_by(MaintenanceRequest.created_at.desc()).offset(offset).limit(page_size).all()
    
    # Convert to Pydantic models
    items = [MaintenanceRequestResponse.from_orm(req) for req in requests]
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.post("", response_model=MaintenanceRequestResponse, status_code=status.HTTP_201_CREATED)
def create_maintenance_request(
    data: MaintenanceRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new maintenance request.
    
    Business rules:
    - Equipment must exist (if target is equipment)
    - Requester is automatically set to current user
    - Status is automatically set to NEW
    - Company is inherited from equipment (or default for work center)
    """
    # Validate target and fetch company info
    target_company = "Adani Enterprises"
    
    if data.target_type == MaintenanceTargetType.EQUIPMENT:
        equipment = db.query(Equipment).filter(Equipment.id == data.equipment_id).first()
        if not equipment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Equipment with id {data.equipment_id} not found"
            )
        target_company = equipment.company
    
    # For work center, just use the provided name (no validation needed)
    
    # Validate technician exists if provided
    if data.technician_id:
        technician = db.query(User).filter(User.id == data.technician_id).first()
        if not technician:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Technician with id {data.technician_id} not found"
            )
    
    # Validate scheduled date is in the future if provided
    scheduled_datetime = None
    if data.scheduled_date:
        try:
            # Handle both date-only (YYYY-MM-DD) and full datetime strings
            date_string = data.scheduled_date
            if 'T' not in date_string:
                # If only date is provided, append time at midnight
                date_string = f"{date_string}T00:00:00"
            
            scheduled_datetime = datetime.fromisoformat(date_string.replace('Z', '+00:00'))
            if scheduled_datetime < datetime.utcnow():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Scheduled date must be in the future"
                )
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use ISO format (YYYY-MM-DD)"
            )
    
    # Create maintenance request
    request = MaintenanceRequest(
        subject=data.subject,
        description=data.description,
        category=data.category,
        priority=data.priority,
        
        target_type=data.target_type,
        equipment_id=data.equipment_id,
        work_center_name=data.work_center_name,
        
        requester_id=current_user.id,
        technician_id=data.technician_id,
        scheduled_date=scheduled_datetime,
        status=RequestStatus.NEW,
        company=target_company
    )
    
    db.add(request)
    db.commit()
    db.refresh(request)
    
    return request


@router.get("/{request_id}", response_model=MaintenanceRequestResponse)
def get_maintenance_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a maintenance request by ID"""
    request = db.query(MaintenanceRequest).filter(MaintenanceRequest.id == request_id).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance request not found"
        )
    
    return request


@router.put("/{request_id}", response_model=MaintenanceRequestResponse)
def update_maintenance_request(
    request_id: int,
    data: MaintenanceRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a maintenance request"""
    request = db.query(MaintenanceRequest).filter(MaintenanceRequest.id == request_id).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance request not found"
        )
    
    # Update fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(request, field, value)
    
    db.commit()
    db.refresh(request)
    
    return request

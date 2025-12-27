from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..models import Equipment, User, UserRole, MaintenanceTeam
from ..schemas.equipment import (
    EquipmentCreate,
    EquipmentUpdate,
    EquipmentResponse,
    EquipmentListResponse
)
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/equipment", tags=["Equipment"])


@router.get("", response_model=EquipmentListResponse)
def list_equipment(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    is_critical: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all equipment with pagination, search, and filters.
    Accessible to all authenticated users.
    """
    query = db.query(Equipment)
    
    # Apply search filter
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Equipment.name.ilike(search_filter)) |
            (Equipment.serial_number.ilike(search_filter)) |
            (Equipment.department.ilike(search_filter))
        )
    
    # Apply category filter
    if category:
        query = query.filter(Equipment.category == category)
    
    # Apply critical filter
    if is_critical is not None:
        query = query.filter(Equipment.is_critical == is_critical)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()
    
    return EquipmentListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{equipment_id}", response_model=EquipmentResponse)
def get_equipment(
    equipment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get equipment by ID.
    Accessible to all authenticated users.
    """
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found"
        )
    
    return equipment


@router.post("", response_model=EquipmentResponse, status_code=status.HTTP_201_CREATED)
def create_equipment(
    data: EquipmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create new equipment.
    Only MANAGER and ADMIN can create equipment.
    """
    # Role check
    if current_user.role not in [UserRole.MANAGER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers and admins can create equipment"
        )
    
    # Check for duplicate serial number
    existing = db.query(Equipment).filter(
        Equipment.serial_number == data.serial_number
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Equipment with this serial number already exists"
        )
    
    # Create equipment
    equipment = Equipment(**data.model_dump())
    
    # Auto-populate maintenance_team string if ID is provided but string is not
    if equipment.maintenance_team_id and not equipment.maintenance_team:
        team = db.query(MaintenanceTeam).filter(MaintenanceTeam.id == equipment.maintenance_team_id).first()
        if team:
            equipment.maintenance_team = team.name
            
    db.add(equipment)
    db.commit()
    db.refresh(equipment)
    
    return equipment


@router.put("/{equipment_id}", response_model=EquipmentResponse)
def update_equipment(
    equipment_id: int,
    data: EquipmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update equipment.
    Only MANAGER and ADMIN can update equipment.
    """
    # Role check
    if current_user.role not in [UserRole.MANAGER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers and admins can update equipment"
        )
    
    # Get equipment
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found"
        )
    
    # Update fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(equipment, field, value)
        
    # Sync maintenance_team string if ID changed
    if 'maintenance_team_id' in update_data:
         if equipment.maintenance_team_id:
             team = db.query(MaintenanceTeam).filter(MaintenanceTeam.id == equipment.maintenance_team_id).first()
             if team:
                 equipment.maintenance_team = team.name
         else:
             equipment.maintenance_team = None
    
    db.commit()
    db.refresh(equipment)
    
    return equipment


@router.delete("/{equipment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_equipment(
    equipment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete equipment.
    Only ADMIN can delete equipment.
    """
    # Role check
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete equipment"
        )
    
    # Get equipment
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found"
        )
    
    # Check if equipment has maintenance requests
    if equipment.maintenance_requests:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete equipment with existing maintenance requests"
        )
    
    db.delete(equipment)
    db.commit()
    
    return None

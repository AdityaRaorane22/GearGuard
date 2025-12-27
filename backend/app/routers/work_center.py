from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.work_center import WorkCenter
from ..schemas.work_center import WorkCenterCreate, WorkCenterUpdate, WorkCenter as WorkCenterSchema
from ..utils.dependencies import get_current_user
from ..models.user import User

router = APIRouter(
    prefix="/work-centers",
    tags=["work-centers"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=WorkCenterSchema, status_code=status.HTTP_201_CREATED)
def create_work_center(
    work_center: WorkCenterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new work center"""
    # Check if code already exists
    db_work_center = db.query(WorkCenter).filter(WorkCenter.code == work_center.code).first()
    if db_work_center:
        raise HTTPException(status_code=400, detail="Work center with this code already exists")
    
    new_work_center = WorkCenter(**work_center.dict())
    db.add(new_work_center)
    db.commit()
    db.refresh(new_work_center)
    return new_work_center

@router.get("/", response_model=List[WorkCenterSchema])
def read_work_centers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all work centers"""
    work_centers = db.query(WorkCenter).offset(skip).limit(limit).all()
    return work_centers

@router.get("/{work_center_id}", response_model=WorkCenterSchema)
def read_work_center(
    work_center_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve a specific work center"""
    work_center = db.query(WorkCenter).filter(WorkCenter.id == work_center_id).first()
    if work_center is None:
        raise HTTPException(status_code=404, detail="Work center not found")
    return work_center

@router.put("/{work_center_id}", response_model=WorkCenterSchema)
def update_work_center(
    work_center_id: int,
    work_center_update: WorkCenterUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a work center"""
    db_work_center = db.query(WorkCenter).filter(WorkCenter.id == work_center_id).first()
    if db_work_center is None:
        raise HTTPException(status_code=404, detail="Work center not found")
    
    update_data = work_center_update.dict(exclude_unset=True)
    
    # Check for code uniqueness if code is being updated
    if "code" in update_data and update_data["code"] != db_work_center.code:
        existing_code = db.query(WorkCenter).filter(WorkCenter.code == update_data["code"]).first()
        if existing_code:
            raise HTTPException(status_code=400, detail="Work center with this code already exists")
            
    for key, value in update_data.items():
        setattr(db_work_center, key, value)
        
    db.commit()
    db.refresh(db_work_center)
    return db_work_center

@router.delete("/{work_center_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_work_center(
    work_center_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a work center"""
    db_work_center = db.query(WorkCenter).filter(WorkCenter.id == work_center_id).first()
    if db_work_center is None:
        raise HTTPException(status_code=404, detail="Work center not found")
    
    # Check if used in maintenance requests?
    # For now, let's allow deletion or let FK constraint fail if it's used.
    
    db.delete(db_work_center)
    db.commit()
    return None

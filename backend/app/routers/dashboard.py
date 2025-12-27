from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime

from ..database import get_db
from ..models import MaintenanceRequest, Equipment, User, RequestStatus, UserRole
from ..schemas.dashboard import DashboardResponse, DashboardMetrics, MaintenanceRequestSummary
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/metrics", response_model=DashboardResponse)
def get_dashboard_data(
    search: str = Query(None, description="Search query for filtering requests"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get dashboard metrics and recent maintenance requests.
    Only accessible to Manager and Admin roles.
    """
    # Role check
    if current_user.role not in [UserRole.MANAGER, UserRole.ADMIN]:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Access forbidden")

    # Calculate metrics
    
    # 1. Critical Equipment
    critical_equipment_count = db.query(Equipment).filter(Equipment.is_critical == True).count()
    avg_health = db.query(func.avg(Equipment.health_score)).scalar() or 0
    
    # 2. Technician Load (simplified calculation)
    total_technicians = db.query(User).filter(User.role == UserRole.TECHNICIAN).count()
    active_requests = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.status.in_([RequestStatus.NEW, RequestStatus.IN_PROGRESS])
    ).count()
    
    technician_utilization = 0
    if total_technicians > 0:
        # Simple formula: (active requests / (technicians * 5)) * 100
        # Assumes each technician can handle 5 requests optimally
        technician_utilization = min(int((active_requests / (total_technicians * 5)) * 100), 100)
    
    # 3. Open Requests
    open_requests_count = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.status != RequestStatus.REPAIRED
    ).count()
    
    overdue_count = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.status != RequestStatus.REPAIRED,
        MaintenanceRequest.scheduled_date < datetime.utcnow()
    ).count()
    
    metrics = DashboardMetrics(
        critical_equipment={
            "count": critical_equipment_count,
            "healthPercentage": int(avg_health)
        },
        technician_load={
            "utilizationPercentage": technician_utilization
        },
        open_requests={
            "total": open_requests_count,
            "overdue": overdue_count
        }
    )
    
    # Get recent maintenance requests with search filter
    from sqlalchemy.orm import aliased
    
    # Create aliases for the User table (requester and technician)
    Requester = aliased(User)
    Technician = aliased(User)
    
    query = db.query(MaintenanceRequest).join(
        Equipment, MaintenanceRequest.equipment_id == Equipment.id
    ).join(
        Requester, MaintenanceRequest.requester_id == Requester.id
    ).outerjoin(
        Technician, MaintenanceRequest.technician_id == Technician.id
    )
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (MaintenanceRequest.subject.ilike(search_filter)) |
            (Equipment.name.ilike(search_filter)) |
            (Requester.name.ilike(search_filter)) |
            (Technician.name.ilike(search_filter))
        )
    
    requests = query.order_by(MaintenanceRequest.created_at.desc()).limit(10).all()
    
    # Format requests for response
    recent_requests = []
    for req in requests:
        recent_requests.append(MaintenanceRequestSummary(
            id=req.id,
            subject=req.subject,
            employee=req.requester.name if req.requester else "Unknown",
            technician=req.technician.name if req.technician else "Unassigned",
            category=req.category.value,
            status=req.status.value,
            company=req.company,
            scheduled_date=req.scheduled_date.isoformat() if req.scheduled_date else None,
            is_overdue=req.is_overdue
        ))
    
    return DashboardResponse(
        metrics=metrics,
        recent_requests=recent_requests
    )

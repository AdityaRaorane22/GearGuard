from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import MaintenanceTeam, User
from ..schemas.team import MaintenanceTeamCreate, MaintenanceTeamUpdate, MaintenanceTeamResponse, MaintenanceTeamListResponse
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/teams", tags=["Maintenance Teams"])

@router.get("", response_model=MaintenanceTeamListResponse)
def list_teams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all maintenance teams"""
    teams = db.query(MaintenanceTeam).all()
    return {
        "items": teams,
        "total": len(teams)
    }

@router.post("", response_model=MaintenanceTeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(
    team_data: MaintenanceTeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new maintenance team"""
    # Check for duplicate name
    if db.query(MaintenanceTeam).filter(MaintenanceTeam.name == team_data.name).first():
        raise HTTPException(status_code=400, detail="Team with this name already exists")
    
    # Create Team
    new_team = MaintenanceTeam(
        name=team_data.name,
        company=team_data.company
    )
    
    # Add Members
    if team_data.member_ids:
        members = db.query(User).filter(User.id.in_(team_data.member_ids)).all()
        new_team.members = members
    
    db.add(new_team)
    db.commit()
    db.refresh(new_team)
    return new_team

@router.get("/{team_id}", response_model=MaintenanceTeamResponse)
def get_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get team details"""
    team = db.query(MaintenanceTeam).filter(MaintenanceTeam.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Maintenance Team not found")
    return team

@router.put("/{team_id}", response_model=MaintenanceTeamResponse)
def update_team(
    team_id: int,
    team_data: MaintenanceTeamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update team details and members"""
    team = db.query(MaintenanceTeam).filter(MaintenanceTeam.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Maintenance Team not found")
        
    if team_data.name:
        # Check uniqueness if name changed
        existing = db.query(MaintenanceTeam).filter(MaintenanceTeam.name == team_data.name).first()
        if existing and existing.id != team_id:
             raise HTTPException(status_code=400, detail="Team with this name already exists")
        team.name = team_data.name
        
    if team_data.company:
        team.company = team_data.company
        
    if team_data.member_ids is not None:
        members = db.query(User).filter(User.id.in_(team_data.member_ids)).all()
        team.members = members
        
    db.commit()
    db.refresh(team)
    return team

@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a team"""
    team = db.query(MaintenanceTeam).filter(MaintenanceTeam.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Maintenance Team not found")
        
    # Check if used by equipment
    if team.equipment:
        raise HTTPException(status_code=400, detail="Cannot delete team assigned to equipment")
        
    db.delete(team)
    db.commit()

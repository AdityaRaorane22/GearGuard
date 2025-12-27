from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from database import get_db
from models import MaintenanceTeam, User
from schemas import UserResponse
from utils.dependencies import get_admin_user

router = APIRouter(
    prefix="/api/v1/teams",
    tags=["maintenance_teams"],
)


class MaintenanceTeamBase(BaseModel):
class MaintenanceTeamCreate(MaintenanceTeamBase):
    member_ids: Optional[List[UUID]] = Field(default_factory=list, description="Initial member IDs")


class MaintenanceTeamUpdate(BaseModel):
    team_name: Optional[str] = Field(None, max_length=255, description="Team name")
    specialization: Optional[str] = Field(None, max_length=255, description="Team specialization")


class MaintenanceTeamListResponse(BaseModel):
    id: UUID
    team_name: str
    specialization: Optional[str]
    member_count: int

    class Config:
        from_attributes = True


class MaintenanceTeamDetailResponse(BaseModel):
    id: UUID
    team_name: str
    specialization: Optional[str]
    members: List[UserResponse]

    class Config:
        from_attributes = True


@router.post("", response_model=MaintenanceTeamDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_team(
    team_data: MaintenanceTeamCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> MaintenanceTeamDetailResponse:
    """Create a maintenance team with optional initial members (admin only)."""
    # Ensure team name is unique
    existing = await db.execute(select(MaintenanceTeam).where(MaintenanceTeam.team_name == team_data.team_name))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Team name already exists")

    # Fetch members if provided
    members: List[User] = []
    if team_data.member_ids:
        users_result = await db.execute(select(User).where(User.id.in_(team_data.member_ids)))
        members = list(users_result.scalars().all())

    team = MaintenanceTeam(
        team_name=team_data.team_name,
        specialization=team_data.specialization,
    )
    team.members = members

    db.add(team)
    await db.commit()
    await db.refresh(team)

    return MaintenanceTeamDetailResponse(
        id=team.id,
        team_name=team.team_name,
        specialization=team.specialization,
        members=[UserResponse.model_validate(m) for m in team.members],
    )


@router.get("", response_model=List[MaintenanceTeamListResponse])
async def list_teams(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> List[MaintenanceTeamListResponse]:
    """List all teams with member counts (admin only)."""
    result = await db.execute(
        select(MaintenanceTeam).options(selectinload(MaintenanceTeam.members))
    )
    teams = result.scalars().all()

    responses: List[MaintenanceTeamListResponse] = []
    for team in teams:
        responses.append(
            MaintenanceTeamListResponse(
                id=team.id,
                team_name=team.team_name,
                specialization=team.specialization,
                member_count=len(team.members),
            )
        )
    return responses


@router.get("/{team_id}", response_model=MaintenanceTeamDetailResponse)
async def get_team(
    team_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> MaintenanceTeamDetailResponse:
    """Get a single team with its members (admin only)."""
    result = await db.execute(
        select(MaintenanceTeam)
        .where(MaintenanceTeam.id == team_id)
        .options(selectinload(MaintenanceTeam.members))
    )
    team = result.scalar_one_or_none()
    if team is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")

    return MaintenanceTeamDetailResponse(
        id=team.id,
        team_name=team.team_name,
        specialization=team.specialization,
        members=[UserResponse.model_validate(m) for m in team.members],
    )


@router.patch("/{team_id}", response_model=MaintenanceTeamDetailResponse)
async def update_team(
    team_id: UUID,
    team_data: MaintenanceTeamUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> MaintenanceTeamDetailResponse:
    """Update team name or specialization (admin only)."""
    result = await db.execute(
        select(MaintenanceTeam)
        .where(MaintenanceTeam.id == team_id)
        .options(selectinload(MaintenanceTeam.members))
    )
    team = result.scalar_one_or_none()
    if team is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")

    # Uniqueness check for team_name
    if team_data.team_name and team_data.team_name != team.team_name:
        existing = await db.execute(
            select(MaintenanceTeam).where(MaintenanceTeam.team_name == team_data.team_name)
        )
        if existing.scalar_one_or_none() is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Team name already exists")

    updates = team_data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(team, field, value)

    await db.commit()
    await db.refresh(team)

    return MaintenanceTeamDetailResponse(
        id=team.id,
        team_name=team.team_name,
        specialization=team.specialization,
        members=[UserResponse.model_validate(m) for m in team.members],
    )


@router.post("/{team_id}/members/{user_id}", response_model=MaintenanceTeamDetailResponse)
async def add_team_member(
    team_id: UUID,
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> MaintenanceTeamDetailResponse:
    """Add a member to a team (admin only)."""
    team_result = await db.execute(
        select(MaintenanceTeam)
        .where(MaintenanceTeam.id == team_id)
        .options(selectinload(MaintenanceTeam.members))
    )
    team = team_result.scalar_one_or_none()
    if team is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")

    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user in team.members:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already a member")

    team.members.append(user)
    await db.commit()
    await db.refresh(team)

    return MaintenanceTeamDetailResponse(
        id=team.id,
        team_name=team.team_name,
        specialization=team.specialization,
        members=[UserResponse.model_validate(m) for m in team.members],
    )


@router.delete("/{team_id}/members/{user_id}", response_model=MaintenanceTeamDetailResponse)
async def remove_team_member(
    team_id: UUID,
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> MaintenanceTeamDetailResponse:
    """Remove a member from a team (admin only)."""
    team_result = await db.execute(
        select(MaintenanceTeam)
        .where(MaintenanceTeam.id == team_id)
        .options(selectinload(MaintenanceTeam.members))
    )
    team = team_result.scalar_one_or_none()
    if team is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")

    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user not in team.members:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is not a member of this team")

    team.members.remove(user)
    await db.commit()
    await db.refresh(team)

    return MaintenanceTeamDetailResponse(
        id=team.id,
        team_name=team.team_name,
        specialization=team.specialization,
        members=[UserResponse.model_validate(m) for m in team.members],
    )

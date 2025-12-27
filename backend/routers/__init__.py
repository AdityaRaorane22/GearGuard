"""API routers for GearGuard application."""

from routers.auth import router as auth_router
from routers.equipment import router as equipment_router
from routers.maintenance_team import router as maintenance_team_router
from routers.maintenance_request import router as maintenance_request_router
from routers.dashboard import router as dashboard_router

__all__ = [
	"auth_router",
	"equipment_router",
	"maintenance_team_router",
	"maintenance_request_router",
	"dashboard_router",
]

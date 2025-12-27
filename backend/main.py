from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import init_db
from routers import (
    auth_router,
    equipment_router,
    maintenance_team_router,
    maintenance_request_router,
    dashboard_router,
)

app = FastAPI(title="GearGuard API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup() -> None:
    await init_db()


# Health check
@app.get("/")
async def health_check():
    return {"status": "ok"}


# Router registrations (with explicit prefixes as requested)
app.include_router(auth_router, prefix="/auth")
app.include_router(equipment_router, prefix="/api/equipment")
app.include_router(maintenance_team_router, prefix="/api/teams")
app.include_router(maintenance_request_router, prefix="/api/requests")
app.include_router(dashboard_router, prefix="/api/dashboard")

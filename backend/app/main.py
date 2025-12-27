from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routers import auth, dashboard, equipment, maintenance, teams, users

# Initialize FastAPI app
app = FastAPI(title="GearGuard API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(equipment.router, prefix="/api")
app.include_router(maintenance.router, prefix="/api")
app.include_router(teams.router, prefix="/api")
app.include_router(users.router, prefix="/api")


@app.get("/")
def root():
    """Root endpoint"""
    return {"message": "GearGuard API is running"}


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

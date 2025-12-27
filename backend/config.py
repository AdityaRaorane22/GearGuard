from typing import List

from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables and .env file.
    Uses Pydantic v2 BaseSettings for validation and type checking.
    """

    # Database Configuration
    database_url: str = Field(
        default="postgresql+asyncpg://user:password@localhost/gearguard",
        description="PostgreSQL async connection URL"
    )

    # JWT Configuration
    secret_key: str = Field(
        default="your-secret-key-change-this-in-production",
        description="Secret key for JWT token signing"
    )
    
    algorithm: str = Field(
        default="HS256",
        description="Algorithm used for JWT token signing"
    )
    
    access_token_expire_minutes: int = Field(
        default=30,
        description="Access token expiration time in minutes"
    )

    # CORS Configuration
    cors_origins: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:5173"],
        description="List of allowed CORS origins"
    )

    # Application Configuration
    app_name: str = Field(
        default="GearGuard",
        description="Application name"
    )
    
    debug: bool = Field(
        default=False,
        description="Debug mode flag"
    )

    # Server Configuration
    host: str = Field(
        default="0.0.0.0",
        description="Server host"
    )
    
    port: int = Field(
        default=8000,
        description="Server port"
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Create global settings instance
settings = Settings()

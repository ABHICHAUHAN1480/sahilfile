from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Inventory & Order Management API"
    database_url: str = Field(
        default="postgresql+psycopg://inventory_user:inventory_password@localhost:5432/inventory_db",
        validation_alias="DATABASE_URL",
    )
    backend_cors_origins: str = Field(
        default="http://localhost:5173,http://localhost:3000",
        validation_alias="BACKEND_CORS_ORIGINS",
    )
    backend_cors_origin_regex: str | None = Field(default=None, validation_alias="BACKEND_CORS_ORIGIN_REGEX")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql+psycopg://", 1)
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+psycopg://", 1)
        return value

    @property
    def cors_origins(self) -> list[str]:
        origins = []
        for origin in self.backend_cors_origins.split(","):
            normalized_origin = origin.strip().rstrip("/")
            if normalized_origin:
                origins.append(normalized_origin)
        return origins


@lru_cache
def get_settings() -> Settings:
    return Settings()

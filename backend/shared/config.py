"""Shared settings loaded from environment variables. Every service imports this."""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"
    log_level: str = "info"

    # Postgres
    database_url: str = "postgresql+asyncpg://novagen:novagen@postgres:5432/novagen"

    # Mongo
    mongo_url: str = "mongodb://novagen:novagen@mongo:27017"
    mongo_db_name: str = "novagen"

    # Neo4j
    neo4j_url: str = "bolt://neo4j:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = "neo4j"

    # Redis
    redis_url: str = "redis://redis:6379/0"

    # MinIO
    minio_endpoint: str = "minio:9000"
    minio_root_user: str = "novagen"
    minio_root_password: str = "novagen"
    minio_bucket: str = "novagen-files"

    # Auth
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60
    jwt_refresh_expire_days: int = 7
    google_client_id: str = ""
    google_client_secret: str = ""
    microsoft_client_id: str = ""
    microsoft_client_secret: str = ""

    # Internal automation — read only inside automation-service, never surfaced via API responses
    # SNS Agent Workbench — a real webhook URL from a deployed workflow, not a
    # generic REST API (that platform doesn't have one). See
    # backend/automation-service/app/services/sns_client.py for how this is used
    # and where this URL actually comes from.
    sns_workbench_webhook_url: str = ""

    # External literature search (optional — raises NCBI's rate limit from 3 to 10 req/sec)
    ncbi_api_key: str = ""

    # Internal service-to-service URLs (never routed through the gateway).
    # Defaults are Docker Compose hostnames; override to http://localhost:<port>
    # in a native (no-Docker) .env — see deployment/native/.env.native.example.
    internal_automation_url: str = "http://automation-service:8009"
    internal_report_service_url: str = "http://report-service:8006"
    internal_notification_service_url: str = "http://notification-service:8007"


@lru_cache
def get_settings() -> Settings:
    return Settings()

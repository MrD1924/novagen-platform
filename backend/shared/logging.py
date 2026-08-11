"""Structured JSON logging shared by every service, plus an audit-log helper
that every service should call for security-relevant actions (login, data export,
prediction run, report generation, role change, etc.)."""
import json
import logging
import sys
import time
import uuid
from typing import Any


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime(record.created)),
            "level": record.levelname,
            "service": getattr(record, "service", "unknown"),
            "message": record.getMessage(),
        }
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload)


def get_logger(service_name: str) -> logging.Logger:
    logger = logging.getLogger(service_name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JsonFormatter())
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logging.LoggerAdapter(logger, {"service": service_name})  # type: ignore[return-value]


def new_request_id() -> str:
    return str(uuid.uuid4())


async def write_audit_log(db_session, *, actor_id: str, action: str, resource: str, metadata: dict[str, Any] | None = None) -> None:
    """Every service writes to the shared `audit_logs` Postgres table (see database/postgres/init).
    Kept as a lightweight raw-SQL insert so it has zero dependency on any single service's ORM models."""
    from sqlalchemy import text

    await db_session.execute(
        text(
            "INSERT INTO audit_logs (id, actor_id, action, resource, metadata, created_at) "
            "VALUES (gen_random_uuid(), :actor_id, :action, :resource, :metadata, now())"
        ),
        {"actor_id": actor_id, "action": action, "resource": resource, "metadata": json.dumps(metadata or {})},
    )
    await db_session.commit()

from fastapi import FastAPI

from app.api.routes import router as auth_router
from app.api.admin_routes import router as admin_router

import sys
sys.path.append("/app")
from shared.database import check_postgres_health  # noqa: E402
from shared.logging import get_logger  # noqa: E402

logger = get_logger("auth-service")

app = FastAPI(title="NovaGen Auth Service", version="1.0.0")
app.include_router(auth_router)
app.include_router(admin_router)


@app.get("/health")
async def health():
    db_ok = await check_postgres_health()
    return {"status": "ok" if db_ok else "degraded", "service": "auth-service", "postgres": db_ok}

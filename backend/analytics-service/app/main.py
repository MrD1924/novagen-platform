from fastapi import FastAPI

from app.api.routes import router as analytics_router

import sys
sys.path.append("/app")
from shared.database import check_postgres_health  # noqa: E402

app = FastAPI(title="NovaGen Analytics Service", version="1.0.0")
app.include_router(analytics_router)


@app.get("/health")
async def health():
    db_ok = await check_postgres_health()
    return {"status": "ok" if db_ok else "degraded", "service": "analytics-service", "postgres": db_ok}

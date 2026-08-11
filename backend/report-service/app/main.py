from fastapi import FastAPI

from app.api.routes import router as report_router

import sys
sys.path.append("/app")
from shared.database import check_postgres_health  # noqa: E402

app = FastAPI(title="NovaGen Report Service", version="1.0.0")
app.include_router(report_router)


@app.get("/health")
async def health():
    db_ok = await check_postgres_health()
    return {"status": "ok" if db_ok else "degraded", "service": "report-service", "postgres": db_ok}

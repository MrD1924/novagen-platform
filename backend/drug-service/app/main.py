from fastapi import FastAPI

from app.api.routes import router as drug_router

import sys
sys.path.append("/app")
from shared.database import check_postgres_health  # noqa: E402

app = FastAPI(title="NovaGen Drug Discovery Service", version="1.0.0")
app.include_router(drug_router)


@app.get("/health")
async def health():
    db_ok = await check_postgres_health()
    return {"status": "ok" if db_ok else "degraded", "service": "drug-service", "postgres": db_ok}

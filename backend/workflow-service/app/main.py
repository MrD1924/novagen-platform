from fastapi import FastAPI

from app.api.routes import router as workflow_router

app = FastAPI(title="NovaGen Workflow Service", version="1.0.0")
app.include_router(workflow_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "workflow-service"}

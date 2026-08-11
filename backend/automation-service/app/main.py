from fastapi import APIRouter, FastAPI

from app.api.internal_routes import ChatRequest, ChatResponse, JobAck, JobRequest, enqueue_job, handle_chat

app = FastAPI(title="NovaGen Automation Service (internal)", version="1.0.0")

internal_router = APIRouter(prefix="/internal/v1")


@internal_router.post("/jobs", response_model=JobAck)
async def create_job(payload: JobRequest):
    return enqueue_job(payload)


@internal_router.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest):
    return handle_chat(payload)


app.include_router(internal_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "automation-service"}

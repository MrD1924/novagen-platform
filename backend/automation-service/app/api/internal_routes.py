from pydantic import BaseModel

from app.worker import run_sns_job


class JobRequest(BaseModel):
    pipeline_run_id: str
    stage: str
    user_id: str | None = None


class JobAck(BaseModel):
    queued: bool


class ChatRequest(BaseModel):
    query: str
    context: dict


class ChatResponse(BaseModel):
    answer: str | None  # None if SNS Workbench had no chat_query route wired up


def enqueue_job(payload: JobRequest) -> JobAck:
    run_sns_job.delay(payload.pipeline_run_id, payload.stage, payload.user_id)
    return JobAck(queued=True)


def handle_chat(payload: ChatRequest) -> ChatResponse:
    """Synchronous (not Celery) since a chat UI needs an answer now, not
    whenever a worker gets to it."""
    from app.services.sns_client import answer_chat_query

    result = answer_chat_query(payload.query, payload.context)
    return ChatResponse(answer=result.get("text"))

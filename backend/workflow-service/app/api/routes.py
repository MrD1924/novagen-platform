from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.schemas.workflow import AdvanceStageRequest, PipelineRunCreate, PipelineRunResponse
from app.services import automation_client, pipeline_store, chat_service

import sys
sys.path.append("/app")
from shared.deps import get_current_user  # noqa: E402
from shared.security import TokenPayload  # noqa: E402

router = APIRouter()


class ChatQueryRequest(BaseModel):
    query: str


class ChatQueryResponse(BaseModel):
    answer: str
    source: str  # "sns_workbench" | "fallback" - shown honestly in the UI, not hidden


@router.post("/chat/query", response_model=ChatQueryResponse)
async def chat_query(payload: ChatQueryRequest, user: TokenPayload = Depends(get_current_user)):
    result = await chat_service.answer_chat_query(payload.query, user.email, user.role.value)
    return result


@router.post("/pipeline/start", response_model=PipelineRunResponse, status_code=201)
async def start_pipeline(payload: PipelineRunCreate, user: TokenPayload = Depends(get_current_user)):
    state = await pipeline_store.create_run(str(payload.project_id))
    await automation_client.trigger_pipeline_automation(state["pipeline_run_id"], state["current_stage"], user.sub)
    return state


@router.get("/pipeline/{run_id}", response_model=PipelineRunResponse)
async def get_pipeline(run_id: str, _: TokenPayload = Depends(get_current_user)):
    state = await pipeline_store.get_run(run_id)
    if not state:
        raise HTTPException(404, "Pipeline run not found")
    return state


@router.post("/pipeline/advance", response_model=PipelineRunResponse)
async def advance_pipeline(payload: AdvanceStageRequest, user: TokenPayload = Depends(get_current_user)):
    state = await pipeline_store.advance_stage(payload.pipeline_run_id, payload.to_stage)
    if not state:
        raise HTTPException(400, "Invalid pipeline run or stage")
    await automation_client.trigger_pipeline_automation(state["pipeline_run_id"], state["current_stage"], user.sub)
    return state

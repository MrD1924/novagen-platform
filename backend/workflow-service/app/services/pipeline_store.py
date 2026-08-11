import json
import uuid

import redis.asyncio as redis

import sys
sys.path.append("/app")
from shared.config import get_settings  # noqa: E402

from app.schemas.workflow import PIPELINE_STAGES

settings = get_settings()
_redis = redis.from_url(settings.redis_url, decode_responses=True)

_KEY_PREFIX = "pipeline_run:"


async def create_run(project_id: str) -> dict:
    run_id = str(uuid.uuid4())
    state = {
        "pipeline_run_id": run_id,
        "project_id": project_id,
        "current_stage": PIPELINE_STAGES[0],
        "stages": PIPELINE_STAGES,
        "status": "in_progress",
    }
    await _redis.set(_KEY_PREFIX + run_id, json.dumps(state))
    return state


async def get_run(run_id: str) -> dict | None:
    raw = await _redis.get(_KEY_PREFIX + run_id)
    return json.loads(raw) if raw else None


async def advance_stage(run_id: str, to_stage: str) -> dict | None:
    state = await get_run(run_id)
    if not state or to_stage not in PIPELINE_STAGES:
        return None
    state["current_stage"] = to_stage
    if to_stage == PIPELINE_STAGES[-1]:
        state["status"] = "completed"
    await _redis.set(_KEY_PREFIX + run_id, json.dumps(state))
    return state

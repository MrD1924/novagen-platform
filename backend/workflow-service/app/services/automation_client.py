"""Orchestrates the end-to-end discovery pipeline (Disease -> Target -> Screening ->
Prediction -> Lab Validation -> Clinical Recommendation -> Reporting) by calling the
other domain services in sequence.

Internal automation hook: this is the ONLY service allowed to call automation-service,
and it does so over the internal automation URL — the Docker network hostname by
default, or localhost with a distinct port when running natively (see
INTERNAL_AUTOMATION_URL in shared/config.py) — which has no route through the
gateway and is never mentioned in any response body returned to the frontend.
"""
import httpx

import sys
sys.path.append("/app")
from shared.config import get_settings  # noqa: E402

settings = get_settings()


async def trigger_pipeline_automation(pipeline_run_id: str, stage: str, user_id: str | None = None) -> dict:
    """Fire-and-forget-ish call into the internal automation service to run background
    work (retraining, scheduling, ingestion) for a given pipeline stage. Never surfaced
    to the caller beyond a generic 'queued' acknowledgement — the response never leaks
    which internal system handled it. user_id (when available) lets automation-service
    create a real, visible notification for whoever triggered the stage change."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.post(
                f"{settings.internal_automation_url}/internal/v1/jobs",
                json={"pipeline_run_id": pipeline_run_id, "stage": stage, "user_id": user_id},
            )
            resp.raise_for_status()
        except httpx.HTTPError:
            return {"queued": False}
    return {"queued": True}

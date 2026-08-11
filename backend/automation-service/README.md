# automation-service (internal only)

This service is the **only** place in the entire codebase that talks to SNS Workbench.

## Isolation guarantees

1. **Not in the gateway's route map.** `backend/gateway/app/routes_map.py` is an
   explicit allow-list; automation-service is deliberately absent, so there is no
   public URL path (`/api/v1/automation/*` or otherwise) that reaches it.
2. **Not published on docker-compose.** In `docker-compose.yml` this service uses
   `expose: ["8009"]`, not `ports:`, so the port isn't even reachable from the host
   machine, let alone the public internet — only other containers on `novagen-net`
   can reach it.
3. **Only called by workflow-service**, over the internal automation URL — the
   Docker Compose hostname `http://automation-service:8009` by default, or
   `http://localhost:8009` when running natively (see `INTERNAL_AUTOMATION_URL`
   in `.env` / `shared/config.py`) — and only via `/internal/v1/jobs`.
4. **Responses never echo SNS-specific details.** Every response this service (or
   workflow-service, which proxies its acknowledgement) returns is a generic
   `{"queued": true/false}` — no job IDs, endpoint names, or vendor identifiers that
   could leak into a frontend response body.
5. **No frontend code references this service, SNS, or "Workbench" anywhere** —
   grep the `frontend/` tree for confirmation once Stage 2 lands.

## What it does

Runs the actual background automation named in the spec — data ingestion, model
retraining, pipeline execution, notification dispatch, report generation, experiment
scheduling, clinical workflow steps — as Celery tasks (`app/worker.py`), internally
delegating to a deployed SNS Agent Workbench workflow's webhook URL via
`SNS_WORKBENCH_WEBHOOK_URL` (see `.env.example` and
`app/services/sns_client.py` for exactly how this URL is obtained — it comes
from manually building and deploying a workflow in the SNS Workbench UI,
there is no general REST API), while presenting only the generic
`/internal/v1/jobs` contract to the rest of the platform.

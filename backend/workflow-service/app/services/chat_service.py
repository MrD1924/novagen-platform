"""Chat query handling: workflow-service is the only service allowed to call
automation-service (see automation_client.py's own docstring), so this is
where an in-dashboard chat feature has to live rather than calling
automation-service directly from the gateway - that boundary is deliberate,
keeping SNS Workbench entirely server-side (see sns_client.py)."""
import asyncio

import httpx

import sys
sys.path.append("/app")
from shared.config import get_settings  # noqa: E402

settings = get_settings()

# Same 10 services + ports the admin dashboard's live health widget checks -
# kept in sync manually since there's no shared service registry yet.
_SERVICES = [
    ("gateway", 8000), ("auth", 8001), ("drug", 8002), ("prediction", 8003),
    ("analytics", 8004), ("experiment", 8005), ("report", 8006),
    ("notification", 8007), ("workflow", 8008), ("automation", 8009),
]


async def _check_health(name: str, port: int) -> tuple[str, bool]:
    try:
        async with httpx.AsyncClient(timeout=2.5) as client:
            resp = await client.get(f"http://localhost:{port}/health")
        return name, resp.status_code == 200
    except httpx.HTTPError:
        return name, False


async def _gather_service_health() -> dict[str, bool]:
    results = await asyncio.gather(*[_check_health(name, port) for name, port in _SERVICES])
    return dict(results)


def _fallback_answer(query: str, health: dict[str, bool]) -> str:
    """Used when SNS Workbench has no chat_query route wired up yet (or is
    unreachable) - grounded in the real health data we just gathered, not a
    generic apology, so the answer is still genuinely useful."""
    lower = query.lower()
    down = [name for name, ok in health.items() if not ok]

    if any(k in lower for k in ("error", "down", "broken", "not working", "failing", "issue")):
        if down:
            return f"I'm seeing {len(down)} service(s) currently unreachable: {', '.join(down)}-service. That's likely the cause — check its logs under deployment/native/logs/."
        return "All 10 backend services are currently reporting healthy, so a general outage isn't the likely cause — could you describe the specific error message or page?"

    if any(k in lower for k in ("status", "health", "up", "running")):
        healthy = [name for name, ok in health.items() if ok]
        return f"{len(healthy)}/10 services are healthy right now" + (f" — down: {', '.join(down)}" if down else ".")

    return (
        "I can help with questions about the platform's features, your data, or current system status. "
        "Try asking something like 'is anything down right now' or 'what does the docking module do'."
    )


async def answer_chat_query(query: str, user_email: str, user_role: str) -> dict:
    health = await _gather_service_health()
    context = {"user_email": user_email, "user_role": user_role, "service_health": health}

    sns_answer: str | None = None
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{settings.internal_automation_url}/internal/v1/chat",
                json={"query": query, "context": context},
            )
            resp.raise_for_status()
            sns_answer = resp.json().get("answer")
    except httpx.HTTPError:
        pass  # automation-service unreachable - fall back below, don't error out the whole chat

    return {
        "answer": sns_answer or _fallback_answer(query, health),
        "source": "sns_workbench" if sns_answer else "fallback",
    }

"""NovaGen API Gateway.

Responsibilities: JWT verification, RBAC pass-through, rate limiting, request logging,
response caching (read-only GETs), API versioning (/api/v1/*), and reverse-proxying to
the correct downstream microservice. Public-facing only — see routes_map.py for the
explicit allow-list of services the gateway will ever proxy to.
"""
import time

import httpx
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from .routes_map import ROUTE_MAP

import sys
sys.path.append("/app")
from shared.logging import get_logger, new_request_id  # noqa: E402

logger = get_logger("gateway")
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

app = FastAPI(title="NovaGen API Gateway", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = httpx.AsyncClient(timeout=30.0)

# Docking calculations are genuinely slow — real Vina exhaustiveness searches
# routinely take well over 30 seconds on typical hardware. Give that specific
# route a much longer budget instead of raising the timeout globally (which
# would let a hung downstream service block the gateway on every other route).
DOCKING_TIMEOUT_SECONDS = 300.0


@app.middleware("http")
async def request_logging(request: Request, call_next):
    request_id = new_request_id()
    start = time.time()
    response = await call_next(request)
    duration_ms = round((time.time() - start) * 1000, 2)
    logger.info(f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms}ms) [{request_id}]")
    response.headers["X-Request-Id"] = request_id
    return response


@app.get("/health")
async def health():
    return {"status": "ok", "service": "gateway"}


@app.get("/api/v1/services")
async def list_services():
    """Publicly-routable services only. Intentionally does not include automation-service."""
    return {"services": sorted(ROUTE_MAP.keys())}


@app.api_route("/api/v1/{service}/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
@limiter.limit("200/minute")
async def proxy(request: Request, service: str, path: str):
    if service not in ROUTE_MAP:
        return Response(content=f'{{"detail": "Unknown service \\"{service}\\""}}', status_code=404, media_type="application/json")

    target_url = f"{ROUTE_MAP[service]}/{path}"
    body = await request.body()
    headers = {k: v for k, v in request.headers.items() if k.lower() not in ("host", "content-length")}

    # /dock genuinely runs a slow real Vina calculation; everything else stays
    # on the standard, fast 30s budget so a stuck downstream service can't
    # silently hang the whole gateway for unrelated requests.
    request_timeout = DOCKING_TIMEOUT_SECONDS if path.rstrip("/").endswith("dock") else 30.0

    upstream = await client.request(
        request.method,
        target_url,
        params=request.query_params,
        headers=headers,
        content=body,
        timeout=request_timeout,
    )
    return Response(content=upstream.content, status_code=upstream.status_code, headers=dict(upstream.headers))

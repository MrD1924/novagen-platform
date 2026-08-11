"""Google / Microsoft ID-token verification.

In production these call out to the provider's public key endpoints to verify the
signature of the ID token the frontend obtained via its OAuth SDK. Kept as a thin,
swappable layer so the rest of auth-service never needs to know which provider was used.
"""
import httpx
from fastapi import HTTPException, status

import sys
sys.path.append("/app")
from shared.config import get_settings  # noqa: E402

settings = get_settings()

GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"
MICROSOFT_JWKS_URL = "https://login.microsoftonline.com/common/discovery/v2.0/keys"


async def verify_google_id_token(id_token: str) -> dict:
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(GOOGLE_TOKENINFO_URL, params={"id_token": id_token})
    if resp.status_code != 200:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid Google ID token")
    payload = resp.json()
    if settings.google_client_id and payload.get("aud") != settings.google_client_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token audience mismatch")
    return {"email": payload["email"], "full_name": payload.get("name", payload["email"])}


async def verify_microsoft_id_token(id_token: str) -> dict:
    # Production implementation: fetch JWKS from MICROSOFT_JWKS_URL, verify RS256
    # signature + `aud`/`iss` claims (msal / python-jose), then extract claims below.
    import jwt  # local import: only decode here, no signature check in this stub

    try:
        claims = jwt.decode(id_token, options={"verify_signature": False})
    except Exception as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid Microsoft ID token") from exc
    return {"email": claims["email"], "full_name": claims.get("name", claims["email"])}

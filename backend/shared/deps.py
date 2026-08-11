"""Shared FastAPI dependencies: current-user extraction + role-based guards.
Every non-auth service depends on `get_current_user`; sensitive routes add `require_role(...)`."""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .security import Role, TokenPayload, decode_token

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> TokenPayload:
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")
    try:
        payload = decode_token(credentials.credentials)
    except Exception as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token") from exc
    return TokenPayload(**payload)


def require_role(*allowed: Role):
    async def guard(user: TokenPayload = Depends(get_current_user)) -> TokenPayload:
        if user.role not in allowed:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient role for this action")
        return user

    return guard

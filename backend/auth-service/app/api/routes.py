from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.auth import (
    LoginRequest,
    OAuthLoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UpdateProfileRequest,
    UserResponse,
)
from app.services import auth_service, oauth

import sys
sys.path.append("/app")
from shared.database import get_db  # noqa: E402
from shared.deps import get_current_user  # noqa: E402
from shared.security import TokenPayload, create_access_token, decode_token  # noqa: E402

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    user = await auth_service.register_user(db, payload)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await auth_service.authenticate_user(db, payload.email, payload.password)
    access, refresh = auth_service.issue_tokens(user)

    from shared.logging import write_audit_log
    await write_audit_log(db, actor_id=str(user.id), action="auth.login", resource=f"user:{user.id}")

    return TokenResponse(access_token=access, refresh_token=refresh)


@router.post("/login/oauth", response_model=TokenResponse)
async def login_oauth(payload: OAuthLoginRequest, db: AsyncSession = Depends(get_db)):
    if payload.provider == "google":
        claims = await oauth.verify_google_id_token(payload.id_token)
    elif payload.provider == "microsoft":
        claims = await oauth.verify_microsoft_id_token(payload.id_token)
    else:
        from fastapi import HTTPException
        raise HTTPException(400, "Unsupported provider")

    user = await auth_service.find_or_create_oauth_user(
        db, email=claims["email"], full_name=claims["full_name"], provider=payload.provider
    )
    access, refresh = auth_service.issue_tokens(user)
    return TokenResponse(access_token=access, refresh_token=refresh)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(payload: RefreshRequest, db: AsyncSession = Depends(get_db)):
    from fastapi import HTTPException
    from sqlalchemy import select
    from app.models.user import User

    try:
        claims = decode_token(payload.refresh_token)
        if claims.get("type") != "refresh":
            raise ValueError
    except Exception as exc:
        raise HTTPException(401, "Invalid refresh token") from exc

    result = await db.execute(select(User).where(User.id == claims["sub"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(401, "User no longer exists")

    access, new_refresh = auth_service.issue_tokens(user)
    return TokenResponse(access_token=access, refresh_token=new_refresh)


@router.get("/me", response_model=UserResponse)
async def me(current: TokenPayload = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    from app.models.user import User

    result = await db.execute(select(User).where(User.id == current.sub))
    return result.scalar_one()


@router.patch("/me", response_model=UserResponse)
async def update_me(
    payload: UpdateProfileRequest, current: TokenPayload = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import select
    from app.models.user import User

    result = await db.execute(select(User).where(User.id == current.sub))
    user = result.scalar_one()
    for field, value in payload.model_dump(exclude_unset=True, exclude_none=True).items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return user

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.auth import RegisterRequest

import sys
sys.path.append("/app")
from shared.security import (  # noqa: E402
    Role,
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)


async def register_user(db: AsyncSession, payload: RegisterRequest) -> User:
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        organization=payload.organization,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or not user.hashed_password or not verify_password(password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account is deactivated")
    return user


def issue_tokens(user: User) -> tuple[str, str]:
    role = user.role if isinstance(user.role, Role) else Role(user.role)
    access = create_access_token(str(user.id), user.email, role)
    refresh = create_refresh_token(str(user.id))
    return access, refresh


async def find_or_create_oauth_user(db: AsyncSession, *, email: str, full_name: str, provider: str) -> User:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user:
        return user
    user = User(email=email, full_name=full_name, oauth_provider=provider, role=Role.RESEARCHER)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

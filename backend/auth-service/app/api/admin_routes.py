from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.auth import UserResponse

import sys
sys.path.append("/app")
from shared.database import get_db  # noqa: E402
from shared.deps import require_role  # noqa: E402
from shared.security import Role  # noqa: E402
from shared.logging import write_audit_log  # noqa: E402

router = APIRouter(prefix="/admin", dependencies=[Depends(require_role(Role.ADMIN))])


class UpdateUserRoleRequest(BaseModel):
    role: Role | None = None
    is_active: bool | None = None


class AuditLogEntry(BaseModel):
    id: UUID
    actor_email: str | None
    action: str
    resource: str
    metadata: dict
    created_at: datetime


@router.get("/users", response_model=list[UserResponse])
async def list_users(db: AsyncSession = Depends(get_db)):
    """Every real user row in the platform - no mock data. Ordered newest first
    so recently-registered accounts are easy to find during a demo or review."""
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    payload: UpdateUserRoleRequest,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_role(Role.ADMIN)),
):
    """Change a user's role or activate/deactivate their account. Every change
    is written to the real audit_logs table, not just logged to stdout -
    this is exactly the kind of security-relevant action that table exists for."""
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if user is None:
        raise HTTPException(404, "User not found")

    changes = {}
    if payload.role is not None and payload.role != user.role:
        changes["role"] = {"from": user.role.value, "to": payload.role.value}
        user.role = payload.role
    if payload.is_active is not None and payload.is_active != user.is_active:
        changes["is_active"] = {"from": user.is_active, "to": payload.is_active}
        user.is_active = payload.is_active

    if changes:
        await db.commit()
        await db.refresh(user)
        await write_audit_log(
            db,
            actor_id=admin.sub,
            action="admin.update_user",
            resource=f"user:{user_id}",
            metadata=changes,
        )
    return user


@router.get("/audit-logs", response_model=list[AuditLogEntry])
async def list_audit_logs(limit: int = 100, db: AsyncSession = Depends(get_db)):
    """Real audit trail, joined against users for a readable actor email.
    Raw SQL (matching write_audit_log's own approach) since this route has
    no need for a full ORM model just to read one table."""
    result = await db.execute(
        text(
            "SELECT al.id, u.email AS actor_email, al.action, al.resource, al.metadata, al.created_at "
            "FROM audit_logs al LEFT JOIN users u ON u.id = al.actor_id "
            "ORDER BY al.created_at DESC LIMIT :limit"
        ),
        {"limit": limit},
    )
    return [dict(row._mapping) for row in result]

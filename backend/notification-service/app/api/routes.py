from uuid import UUID

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.schemas.notification import NotificationCreate, NotificationResponse

import sys
sys.path.append("/app")
from shared.database import get_db  # noqa: E402
from shared.deps import get_current_user  # noqa: E402
from shared.security import TokenPayload  # noqa: E402

router = APIRouter()

# In-memory connection registry per process. For multi-instance deployments this
# should be backed by Redis pub/sub (REDIS_URL is already wired in shared/config.py)
# so a notification created on one replica reaches a socket open on another.
_active_sockets: dict[str, list[WebSocket]] = {}


@router.post("", response_model=NotificationResponse, status_code=201)
async def create_notification(payload: NotificationCreate, db: AsyncSession = Depends(get_db)):
    notif = Notification(**payload.model_dump())
    db.add(notif)
    await db.commit()
    await db.refresh(notif)

    for socket in _active_sockets.get(str(payload.user_id), []):
        await socket.send_json({"title": notif.title, "body": notif.body, "id": str(notif.id)})

    return notif


@router.get("", response_model=list[NotificationResponse])
async def list_notifications(unread_only: bool = False, current: TokenPayload = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    query = select(Notification).where(Notification.user_id == current.sub)
    if unread_only:
        query = query.where(Notification.is_read.is_(False))
    result = await db.execute(query.order_by(Notification.created_at.desc()))
    return result.scalars().all()


@router.post("/{notification_id}/read")
async def mark_read(notification_id: UUID, db: AsyncSession = Depends(get_db), current: TokenPayload = Depends(get_current_user)):
    await db.execute(
        update(Notification).where(Notification.id == notification_id, Notification.user_id == current.sub).values(is_read=True)
    )
    await db.commit()
    return {"status": "ok"}


@router.websocket("/ws/{user_id}")
async def notifications_ws(websocket: WebSocket, user_id: str):
    await websocket.accept()
    _active_sockets.setdefault(user_id, []).append(websocket)
    try:
        while True:
            await websocket.receive_text()  # keep-alive; client doesn't need to send anything meaningful
    except WebSocketDisconnect:
        _active_sockets[user_id].remove(websocket)

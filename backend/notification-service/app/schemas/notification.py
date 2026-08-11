from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class NotificationCreate(BaseModel):
    user_id: UUID
    title: str
    body: str | None = None


class NotificationResponse(BaseModel):
    id: UUID
    title: str
    body: str | None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

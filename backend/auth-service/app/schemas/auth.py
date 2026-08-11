from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr

import sys
sys.path.append("/app")
from shared.security import Role  # noqa: E402


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Role = Role.RESEARCHER
    organization: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class OAuthLoginRequest(BaseModel):
    provider: str  # 'google' | 'microsoft'
    id_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    role: Role
    organization: str | None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UpdateProfileRequest(BaseModel):
    full_name: str | None = None
    organization: str | None = None

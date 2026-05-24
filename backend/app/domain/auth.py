from dataclasses import dataclass
from enum import Enum


class UserRole(str, Enum):
    USER = "USER"
    ADMIN = "ADMIN"


@dataclass(slots=True)
class User:
    id: str
    username: str
    password_hash: str
    role: UserRole
    created_at: str
    updated_at: str


@dataclass(slots=True)
class AuthSession:
    id: str
    user_id: str
    refresh_token_hash: str
    created_at: str
    last_activity_at: str
    expires_at: str
    revoked_at: str | None


@dataclass(slots=True)
class AuthTokens:
    access_token: str
    refresh_token: str
    token_type: str
    access_token_expires_in: int


@dataclass(slots=True)
class AuthContext:
    user: User
    session: AuthSession


@dataclass(slots=True)
class AuthenticatedSession:
    user: User
    session: AuthSession
    tokens: AuthTokens

import re

from pydantic import Field, field_validator

from app.domain.auth import AuthenticatedSession, User, UserRole
from app.schemas.base import ApiSchema

USERNAME_PATTERN = re.compile(r"^[A-Za-z0-9_]+$")


class RegisterRequest(ApiSchema):
    username: str = Field(min_length=3, max_length=32)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("username", mode="before")
    @classmethod
    def strip_username(cls, value: str) -> str:
        if isinstance(value, str):
            return value.strip()
        return value

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        if not USERNAME_PATTERN.fullmatch(value):
            raise ValueError(
                "Username may contain only letters, numbers, and underscores."
            )
        return value


class LoginRequest(ApiSchema):
    username: str = Field(min_length=3, max_length=32)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("username", mode="before")
    @classmethod
    def strip_username(cls, value: str) -> str:
        if isinstance(value, str):
            return value.strip()
        return value


class RefreshTokenRequest(ApiSchema):
    refresh_token: str = Field(min_length=20, max_length=512)


class AuthUserResponse(ApiSchema):
    id: str
    username: str
    role: UserRole
    created_at: str
    updated_at: str

    @classmethod
    def from_user(cls, user: User) -> "AuthUserResponse":
        return cls.model_validate(user)


class AuthTokensResponse(ApiSchema):
    user: AuthUserResponse
    access_token: str
    refresh_token: str
    token_type: str
    access_token_expires_in: int

    @classmethod
    def from_authenticated_session(
        cls,
        session: AuthenticatedSession,
    ) -> "AuthTokensResponse":
        return cls(
            user=AuthUserResponse.from_user(session.user),
            access_token=session.tokens.access_token,
            refresh_token=session.tokens.refresh_token,
            token_type=session.tokens.token_type,
            access_token_expires_in=session.tokens.access_token_expires_in,
        )

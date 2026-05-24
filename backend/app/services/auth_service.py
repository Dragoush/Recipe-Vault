import uuid
from dataclasses import replace
from datetime import UTC, datetime, timedelta
from typing import Callable

from app.core.config import settings
from app.core.errors import AuthenticationError, AuthorizationError, UsernameConflictError
from app.core.security import (
    create_access_token,
    decode_access_token,
    generate_opaque_token,
    hash_password,
    hash_token,
    normalize_username,
    verify_password,
)
from app.domain.auth import (
    AuthContext,
    AuthSession,
    AuthTokens,
    AuthenticatedSession,
    User,
    UserRole,
)
from app.repositories.auth_repository import AuthRepository
from app.schemas.auth import LoginRequest, RegisterRequest


def generate_user_id() -> str:
    return f"user-{uuid.uuid4()}"


def generate_session_id() -> str:
    return f"session-{uuid.uuid4()}"


def utc_now() -> datetime:
    return datetime.now(UTC)


def format_timestamp(value: datetime) -> str:
    return value.astimezone(UTC).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def parse_timestamp(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


class AuthService:
    def __init__(
        self,
        repository: AuthRepository,
        jwt_secret_key: str = settings.auth_jwt_secret_key,
        access_token_ttl_seconds: int = settings.auth_access_token_ttl_seconds,
        session_ttl_seconds: int = settings.auth_session_ttl_seconds,
        session_inactivity_ttl_seconds: int = settings.auth_session_inactivity_ttl_seconds,
        password_hash_iterations: int = settings.password_hash_iterations,
        user_id_generator: Callable[[], str] = generate_user_id,
        session_id_generator: Callable[[], str] = generate_session_id,
        now_factory: Callable[[], datetime] = utc_now,
        refresh_token_generator: Callable[[], str] = generate_opaque_token,
    ):
        self.repository = repository
        self.jwt_secret_key = jwt_secret_key
        self.access_token_ttl_seconds = access_token_ttl_seconds
        self.session_ttl_seconds = session_ttl_seconds
        self.session_inactivity_ttl_seconds = session_inactivity_ttl_seconds
        self.password_hash_iterations = password_hash_iterations
        self.user_id_generator = user_id_generator
        self.session_id_generator = session_id_generator
        self.now_factory = now_factory
        self.refresh_token_generator = refresh_token_generator

    def register_user(self, payload: RegisterRequest) -> User:
        normalized_username = normalize_username(payload.username)

        if self.repository.get_user_by_username(normalized_username) is not None:
            raise UsernameConflictError(normalized_username)

        timestamp = format_timestamp(self.now_factory())
        user = User(
            id=self.user_id_generator(),
            username=normalized_username,
            password_hash=hash_password(
                payload.password,
                self.password_hash_iterations,
            ),
            role=UserRole.USER,
            created_at=timestamp,
            updated_at=timestamp,
        )
        return self.repository.create_user(user)

    def login_user(self, payload: LoginRequest) -> AuthenticatedSession:
        normalized_username = normalize_username(payload.username)
        user = self.repository.get_user_by_username(normalized_username)

        if user is None or not verify_password(payload.password, user.password_hash):
            raise AuthenticationError("Invalid username or password.")

        return self._create_authenticated_session(user)

    def refresh_session(self, refresh_token: str) -> AuthenticatedSession:
        session = self.repository.get_session_by_refresh_token_hash(hash_token(refresh_token))

        if session is None:
            raise AuthenticationError("Invalid refresh token.")

        user = self.repository.get_user_by_id(session.user_id)

        if user is None:
            raise AuthenticationError("User account is no longer available.")

        current_time = self.now_factory()
        active_session = self._validate_session(session, current_time)
        rotated_refresh_token = self.refresh_token_generator()
        updated_session = replace(
            active_session,
            refresh_token_hash=hash_token(rotated_refresh_token),
            last_activity_at=format_timestamp(current_time),
        )
        stored_session = self.repository.update_session(updated_session)

        if stored_session is None:
            raise AuthenticationError("Session is no longer available.")

        return AuthenticatedSession(
            user=user,
            session=stored_session,
            tokens=self._build_tokens(
                user=user,
                session=stored_session,
                refresh_token=rotated_refresh_token,
                current_time=current_time,
            ),
        )

    def authenticate_access_token(
        self,
        access_token: str,
        allowed_roles: set[UserRole] | None = None,
    ) -> AuthContext:
        current_time = self.now_factory()

        try:
            payload = decode_access_token(
                access_token,
                secret_key=self.jwt_secret_key,
                now=current_time,
            )
        except ValueError as exc:
            raise AuthenticationError(str(exc)) from exc

        user_id = payload.get("sub")
        session_id = payload.get("session_id")
        role_value = payload.get("role")

        if not isinstance(user_id, str) or not isinstance(session_id, str):
            raise AuthenticationError("Access token is missing required claims.")

        try:
            token_role = UserRole(role_value)
        except ValueError as exc:
            raise AuthenticationError("Access token role is invalid.") from exc

        session = self.repository.get_session_by_id(session_id)

        if session is None:
            raise AuthenticationError("Session is no longer available.")

        user = self.repository.get_user_by_id(user_id)

        if user is None:
            raise AuthenticationError("User account is no longer available.")

        if user.role != token_role:
            raise AuthenticationError("Access token role is no longer valid.")

        if allowed_roles is not None and user.role not in allowed_roles:
            raise AuthorizationError("You are not allowed to access this resource.")

        active_session = self._validate_session(session, current_time)
        touched_session = replace(
            active_session,
            last_activity_at=format_timestamp(current_time),
        )
        stored_session = self.repository.update_session(touched_session)

        if stored_session is None:
            raise AuthenticationError("Session is no longer available.")

        return AuthContext(user=user, session=stored_session)

    def logout_session(self, session_id: str) -> None:
        session = self.repository.get_session_by_id(session_id)

        if session is None or session.revoked_at is not None:
            return

        self.repository.update_session(
            replace(
                session,
                revoked_at=format_timestamp(self.now_factory()),
            )
        )

    def _create_authenticated_session(self, user: User) -> AuthenticatedSession:
        current_time = self.now_factory()
        refresh_token = self.refresh_token_generator()
        session = AuthSession(
            id=self.session_id_generator(),
            user_id=user.id,
            refresh_token_hash=hash_token(refresh_token),
            created_at=format_timestamp(current_time),
            last_activity_at=format_timestamp(current_time),
            expires_at=format_timestamp(
                current_time + timedelta(seconds=self.session_ttl_seconds)
            ),
            revoked_at=None,
        )
        stored_session = self.repository.create_session(session)
        return AuthenticatedSession(
            user=user,
            session=stored_session,
            tokens=self._build_tokens(
                user=user,
                session=stored_session,
                refresh_token=refresh_token,
                current_time=current_time,
            ),
        )

    def _build_tokens(
        self,
        *,
        user: User,
        session: AuthSession,
        refresh_token: str,
        current_time: datetime,
    ) -> AuthTokens:
        access_token_expires_at = current_time + timedelta(
            seconds=self.access_token_ttl_seconds
        )
        return AuthTokens(
            access_token=create_access_token(
                secret_key=self.jwt_secret_key,
                subject=user.id,
                role=user.role.value,
                session_id=session.id,
                expires_at=access_token_expires_at,
                issued_at=current_time,
            ),
            refresh_token=refresh_token,
            token_type="bearer",
            access_token_expires_in=self.access_token_ttl_seconds,
        )

    def _validate_session(
        self,
        session: AuthSession,
        current_time: datetime,
    ) -> AuthSession:
        if session.revoked_at is not None:
            raise AuthenticationError("Session is no longer active.")

        if parse_timestamp(session.expires_at) <= current_time:
            self._revoke_expired_session(session, current_time)
            raise AuthenticationError("Session has expired.")

        idle_deadline = parse_timestamp(session.last_activity_at) + timedelta(
            seconds=self.session_inactivity_ttl_seconds
        )

        if idle_deadline <= current_time:
            self._revoke_expired_session(session, current_time)
            raise AuthenticationError("Session has expired due to inactivity.")

        return session

    def _revoke_expired_session(
        self,
        session: AuthSession,
        current_time: datetime,
    ) -> None:
        self.repository.update_session(
            replace(
                session,
                revoked_at=format_timestamp(current_time),
            )
        )

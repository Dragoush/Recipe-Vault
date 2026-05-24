from datetime import UTC, datetime, timedelta

import pytest

from app.core.errors import AuthenticationError, UsernameConflictError
from app.core.security import hash_token
from app.services.auth_service import AuthService
from app.schemas.auth import LoginRequest, RegisterRequest
from tests.fakes import FakeAuthRepository


def make_auth_service(
    repository: FakeAuthRepository | None = None,
    *,
    now: datetime | None = None,
) -> AuthService:
    current_time = now or datetime(2026, 5, 24, 12, 0, tzinfo=UTC)
    return AuthService(
        repository=repository or FakeAuthRepository(),
        jwt_secret_key="test-secret",
        access_token_ttl_seconds=900,
        session_ttl_seconds=3600,
        session_inactivity_ttl_seconds=300,
        password_hash_iterations=1000,
        user_id_generator=lambda: "user-generated",
        session_id_generator=lambda: "session-generated",
        now_factory=lambda: current_time,
        refresh_token_generator=lambda: "refresh-token-generated",
    )


def test_register_user_normalizes_username_and_hashes_password():
    service = make_auth_service()

    user = service.register_user(
        RegisterRequest.model_validate(
            {"username": "  Test_User  ", "password": "password123"}
        )
    )

    assert user.id == "user-generated"
    assert user.username == "test_user"
    assert user.role.value == "USER"
    assert user.password_hash.startswith("pbkdf2_sha256$")


def test_register_user_rejects_duplicate_username():
    service = make_auth_service()
    payload = RegisterRequest.model_validate(
        {"username": "test_user", "password": "password123"}
    )
    service.register_user(payload)

    with pytest.raises(UsernameConflictError, match='Username "test_user"'):
        service.register_user(payload)


def test_login_user_creates_session_and_returns_tokens():
    service = make_auth_service()
    service.register_user(
        RegisterRequest.model_validate(
            {"username": "test_user", "password": "password123"}
        )
    )

    authenticated_session = service.login_user(
        LoginRequest.model_validate(
            {"username": "TEST_USER", "password": "password123"}
        )
    )

    assert authenticated_session.user.username == "test_user"
    assert authenticated_session.session.id == "session-generated"
    assert authenticated_session.tokens.access_token
    assert authenticated_session.tokens.refresh_token == "refresh-token-generated"
    assert authenticated_session.tokens.token_type == "bearer"


def test_login_user_rejects_invalid_credentials():
    service = make_auth_service()
    service.register_user(
        RegisterRequest.model_validate(
            {"username": "test_user", "password": "password123"}
        )
    )

    with pytest.raises(AuthenticationError, match="Invalid username or password"):
        service.login_user(
            LoginRequest.model_validate(
                {"username": "test_user", "password": "wrongpass123"}
            )
        )


def test_refresh_session_rotates_refresh_token_and_updates_session_activity():
    repository = FakeAuthRepository()
    service = make_auth_service(repository)
    service.register_user(
        RegisterRequest.model_validate(
            {"username": "test_user", "password": "password123"}
        )
    )
    authenticated_session = service.login_user(
        LoginRequest.model_validate(
            {"username": "test_user", "password": "password123"}
        )
    )
    refreshed_service = AuthService(
        repository=repository,
        jwt_secret_key="test-secret",
        access_token_ttl_seconds=900,
        session_ttl_seconds=3600,
        session_inactivity_ttl_seconds=300,
        password_hash_iterations=1000,
        user_id_generator=lambda: "user-generated",
        session_id_generator=lambda: "session-generated",
        now_factory=lambda: datetime(2026, 5, 24, 12, 2, tzinfo=UTC),
        refresh_token_generator=lambda: "rotated-refresh-token",
    )

    refreshed = refreshed_service.refresh_session(
        authenticated_session.tokens.refresh_token
    )

    assert refreshed.tokens.refresh_token == "rotated-refresh-token"
    assert refreshed.session.last_activity_at == "2026-05-24T12:02:00.000Z"
    assert (
        refreshed_service.repository.get_session_by_id("session-generated").refresh_token_hash
        == hash_token("rotated-refresh-token")
    )


def test_authenticate_access_token_rejects_inactive_sessions():
    repository = FakeAuthRepository()
    initial_time = datetime(2026, 5, 24, 12, 0, tzinfo=UTC)
    service = make_auth_service(repository, now=initial_time)
    service.register_user(
        RegisterRequest.model_validate(
            {"username": "test_user", "password": "password123"}
        )
    )
    authenticated_session = service.login_user(
        LoginRequest.model_validate(
            {"username": "test_user", "password": "password123"}
        )
    )
    expired_service = AuthService(
        repository=repository,
        jwt_secret_key="test-secret",
        access_token_ttl_seconds=900,
        session_ttl_seconds=3600,
        session_inactivity_ttl_seconds=300,
        password_hash_iterations=1000,
        now_factory=lambda: initial_time + timedelta(minutes=10),
    )

    with pytest.raises(AuthenticationError, match="inactivity"):
        expired_service.authenticate_access_token(
            authenticated_session.tokens.access_token
        )


def test_logout_session_revokes_current_session():
    repository = FakeAuthRepository()
    service = make_auth_service(repository)
    service.register_user(
        RegisterRequest.model_validate(
            {"username": "test_user", "password": "password123"}
        )
    )
    authenticated_session = service.login_user(
        LoginRequest.model_validate(
            {"username": "test_user", "password": "password123"}
        )
    )

    service.logout_session(authenticated_session.session.id)

    stored_session = repository.get_session_by_id(authenticated_session.session.id)
    assert stored_session is not None
    assert stored_session.revoked_at == "2026-05-24T12:00:00.000Z"

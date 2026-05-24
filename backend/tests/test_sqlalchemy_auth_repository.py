import pytest

from app.core.errors import UsernameConflictError
from app.domain.auth import AuthSession
from app.repositories.sqlalchemy_auth_repository import SQLAlchemyAuthRepository
from tests.factories import build_user

pytestmark = pytest.mark.database


def test_sqlalchemy_auth_repository_persists_users_and_unique_usernames(
    sql_auth_repository: SQLAlchemyAuthRepository,
):
    created_user = sql_auth_repository.create_user(build_user())

    stored_user = sql_auth_repository.get_user_by_username(created_user.username)

    assert stored_user is not None
    assert stored_user.id == created_user.id
    assert stored_user.role.value == "USER"

    with pytest.raises(UsernameConflictError):
        sql_auth_repository.create_user(build_user(id="user-duplicate"))


def test_sqlalchemy_auth_repository_persists_and_updates_sessions(
    sql_auth_repository: SQLAlchemyAuthRepository,
    persisted_test_user,
):
    created_session = sql_auth_repository.create_session(
        AuthSession(
            id="session-1",
            user_id=persisted_test_user.id,
            refresh_token_hash="refresh-hash-1",
            created_at="2026-05-24T12:00:00.000Z",
            last_activity_at="2026-05-24T12:00:00.000Z",
            expires_at="2026-05-24T13:00:00.000Z",
            revoked_at=None,
        )
    )

    stored_by_id = sql_auth_repository.get_session_by_id(created_session.id)
    stored_by_refresh_hash = sql_auth_repository.get_session_by_refresh_token_hash(
        "refresh-hash-1"
    )

    assert stored_by_id is not None
    assert stored_by_refresh_hash is not None
    assert stored_by_id.user_id == persisted_test_user.id

    updated_session = sql_auth_repository.update_session(
        AuthSession(
            id=created_session.id,
            user_id=created_session.user_id,
            refresh_token_hash="refresh-hash-2",
            created_at=created_session.created_at,
            last_activity_at="2026-05-24T12:10:00.000Z",
            expires_at=created_session.expires_at,
            revoked_at="2026-05-24T12:15:00.000Z",
        )
    )

    assert updated_session is not None
    assert updated_session.refresh_token_hash == "refresh-hash-2"
    assert updated_session.last_activity_at == "2026-05-24T12:10:00.000Z"
    assert updated_session.revoked_at == "2026-05-24T12:15:00.000Z"

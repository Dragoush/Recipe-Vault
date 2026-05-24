from dataclasses import replace

from app.domain.auth import AuthSession, User
from app.repositories.auth_repository import AuthRepository


class FakeAuthRepository(AuthRepository):
    def __init__(self):
        self._users_by_id: dict[str, User] = {}
        self._users_by_username: dict[str, User] = {}
        self._sessions_by_id: dict[str, AuthSession] = {}
        self._sessions_by_refresh_token_hash: dict[str, AuthSession] = {}

    def create_user(self, user: User) -> User:
        user_copy = replace(user)
        self._users_by_id[user_copy.id] = user_copy
        self._users_by_username[user_copy.username] = user_copy
        return replace(user_copy)

    def get_user_by_username(self, username: str) -> User | None:
        user = self._users_by_username.get(username)
        return replace(user) if user is not None else None

    def get_user_by_id(self, user_id: str) -> User | None:
        user = self._users_by_id.get(user_id)
        return replace(user) if user is not None else None

    def create_session(self, session: AuthSession) -> AuthSession:
        session_copy = replace(session)
        self._sessions_by_id[session_copy.id] = session_copy
        self._sessions_by_refresh_token_hash[session_copy.refresh_token_hash] = session_copy
        return replace(session_copy)

    def get_session_by_id(self, session_id: str) -> AuthSession | None:
        session = self._sessions_by_id.get(session_id)
        return replace(session) if session is not None else None

    def get_session_by_refresh_token_hash(
        self,
        refresh_token_hash: str,
    ) -> AuthSession | None:
        session = self._sessions_by_refresh_token_hash.get(refresh_token_hash)
        return replace(session) if session is not None else None

    def update_session(self, session: AuthSession) -> AuthSession | None:
        if session.id not in self._sessions_by_id:
            return None

        previous_session = self._sessions_by_id[session.id]
        self._sessions_by_refresh_token_hash.pop(previous_session.refresh_token_hash, None)
        session_copy = replace(session)
        self._sessions_by_id[session_copy.id] = session_copy
        self._sessions_by_refresh_token_hash[session_copy.refresh_token_hash] = session_copy
        return replace(session_copy)

from abc import ABC, abstractmethod

from app.domain.auth import AuthSession, User


class AuthRepository(ABC):
    @abstractmethod
    def create_user(self, user: User) -> User:
        """Store and return a new user."""

    @abstractmethod
    def get_user_by_username(self, username: str) -> User | None:
        """Return a user by normalized username."""

    @abstractmethod
    def get_user_by_id(self, user_id: str) -> User | None:
        """Return a user by id."""

    @abstractmethod
    def create_session(self, session: AuthSession) -> AuthSession:
        """Store and return a new auth session."""

    @abstractmethod
    def get_session_by_id(self, session_id: str) -> AuthSession | None:
        """Return a session by id."""

    @abstractmethod
    def get_session_by_refresh_token_hash(
        self,
        refresh_token_hash: str,
    ) -> AuthSession | None:
        """Return a session by refresh token hash."""

    @abstractmethod
    def update_session(self, session: AuthSession) -> AuthSession | None:
        """Replace and return an existing session or None when it is missing."""

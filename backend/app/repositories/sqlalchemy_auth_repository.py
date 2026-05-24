from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, sessionmaker

from app.core.errors import UsernameConflictError
from app.db.models.auth_session_model import AuthSessionModel
from app.db.models.user_model import UserModel
from app.domain.auth import AuthSession, User, UserRole
from app.repositories.auth_repository import AuthRepository


class SQLAlchemyAuthRepository(AuthRepository):
    def __init__(self, session_factory: sessionmaker[Session]):
        self.session_factory = session_factory

    def create_user(self, user: User) -> User:
        try:
            with self.session_factory.begin() as session:
                user_model = UserModel(
                    id=user.id,
                    username=user.username,
                    password_hash=user.password_hash,
                    role=user.role.value,
                    created_at=self._parse_timestamp(user.created_at),
                    updated_at=self._parse_timestamp(user.updated_at),
                )
                session.add(user_model)
                session.flush()
                return self._to_user_domain(user_model)
        except IntegrityError as exc:
            raise UsernameConflictError(user.username) from exc

    def get_user_by_username(self, username: str) -> User | None:
        with self.session_factory() as session:
            user_model = session.scalar(
                select(UserModel).where(UserModel.username == username)
            )
            return self._to_user_domain(user_model) if user_model is not None else None

    def get_user_by_id(self, user_id: str) -> User | None:
        with self.session_factory() as session:
            user_model = session.get(UserModel, user_id)
            return self._to_user_domain(user_model) if user_model is not None else None

    def create_session(self, session_data: AuthSession) -> AuthSession:
        with self.session_factory.begin() as session:
            session_model = AuthSessionModel(
                id=session_data.id,
                user_id=session_data.user_id,
                refresh_token_hash=session_data.refresh_token_hash,
                created_at=self._parse_timestamp(session_data.created_at),
                last_activity_at=self._parse_timestamp(session_data.last_activity_at),
                expires_at=self._parse_timestamp(session_data.expires_at),
                revoked_at=(
                    self._parse_timestamp(session_data.revoked_at)
                    if session_data.revoked_at is not None
                    else None
                ),
            )
            session.add(session_model)
            session.flush()
            return self._to_session_domain(session_model)

    def get_session_by_id(self, session_id: str) -> AuthSession | None:
        with self.session_factory() as session:
            session_model = session.get(AuthSessionModel, session_id)
            return (
                self._to_session_domain(session_model)
                if session_model is not None
                else None
            )

    def get_session_by_refresh_token_hash(
        self,
        refresh_token_hash: str,
    ) -> AuthSession | None:
        with self.session_factory() as session:
            session_model = session.scalar(
                select(AuthSessionModel).where(
                    AuthSessionModel.refresh_token_hash == refresh_token_hash
                )
            )
            return (
                self._to_session_domain(session_model)
                if session_model is not None
                else None
            )

    def update_session(self, session_data: AuthSession) -> AuthSession | None:
        with self.session_factory.begin() as session:
            session_model = session.get(AuthSessionModel, session_data.id)

            if session_model is None:
                return None

            session_model.refresh_token_hash = session_data.refresh_token_hash
            session_model.last_activity_at = self._parse_timestamp(
                session_data.last_activity_at
            )
            session_model.expires_at = self._parse_timestamp(session_data.expires_at)
            session_model.revoked_at = (
                self._parse_timestamp(session_data.revoked_at)
                if session_data.revoked_at is not None
                else None
            )
            session.flush()
            return self._to_session_domain(session_model)

    @classmethod
    def _to_user_domain(cls, user_model: UserModel) -> User:
        return User(
            id=user_model.id,
            username=user_model.username,
            password_hash=user_model.password_hash,
            role=UserRole(user_model.role),
            created_at=cls._format_timestamp(user_model.created_at),
            updated_at=cls._format_timestamp(user_model.updated_at),
        )

    @classmethod
    def _to_session_domain(cls, session_model: AuthSessionModel) -> AuthSession:
        return AuthSession(
            id=session_model.id,
            user_id=session_model.user_id,
            refresh_token_hash=session_model.refresh_token_hash,
            created_at=cls._format_timestamp(session_model.created_at),
            last_activity_at=cls._format_timestamp(session_model.last_activity_at),
            expires_at=cls._format_timestamp(session_model.expires_at),
            revoked_at=(
                cls._format_timestamp(session_model.revoked_at)
                if session_model.revoked_at is not None
                else None
            ),
        )

    @staticmethod
    def _parse_timestamp(timestamp: str) -> datetime:
        return datetime.fromisoformat(timestamp.replace("Z", "+00:00"))

    @staticmethod
    def _format_timestamp(value: datetime) -> str:
        return (
            value.astimezone(timezone.utc)
            .isoformat(timespec="milliseconds")
            .replace("+00:00", "Z")
        )

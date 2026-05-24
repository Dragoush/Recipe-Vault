from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings


def create_database_engine(database_url: str) -> Engine:
    return create_engine(
        database_url,
        future=True,
        pool_pre_ping=True,
    )

def create_session_factory(database_url: str) -> sessionmaker[Session]:
    engine = create_database_engine(database_url)
    return sessionmaker(
        bind=engine,
        autoflush=False,
        expire_on_commit=False,
        future=True,
    )


database_engine = create_database_engine(settings.database_url)
SessionFactory = sessionmaker(
    bind=database_engine,
    autoflush=False,
    expire_on_commit=False,
    future=True,
)

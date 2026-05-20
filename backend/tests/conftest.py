from pathlib import Path

import psycopg
import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from psycopg import sql
from sqlalchemy import text
from sqlalchemy.engine import make_url

from app.main import create_app
from app.core.config import settings
from app.db.session import create_database_engine, create_session_factory
from app.repositories.sqlalchemy_recipe_repository import SQLAlchemyRecipeRepository
from tests.factories import build_recipe

BACKEND_DIR = Path(__file__).resolve().parents[1]


@pytest.fixture(scope="session")
def alembic_config() -> Config:
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("sqlalchemy.url", settings.test_database_url)
    config.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    return config


@pytest.fixture(scope="session")
def ensure_test_database_exists() -> None:
    test_database_url = make_url(settings.test_database_url)
    admin_database = test_database_url.query.get("maintenance_db", "postgres")
    connect_kwargs = {
        "host": test_database_url.host,
        "port": test_database_url.port,
        "dbname": admin_database,
        "user": test_database_url.username,
        "password": test_database_url.password,
        "autocommit": True,
    }

    with psycopg.connect(**connect_kwargs) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT 1 FROM pg_database WHERE datname = %s",
                (test_database_url.database,),
            )
            database_exists = cursor.fetchone() is not None

            if not database_exists:
                cursor.execute(
                    sql.SQL("CREATE DATABASE {}").format(
                        sql.Identifier(test_database_url.database)
                    )
                )


@pytest.fixture(scope="session")
def test_database_engine(
    alembic_config: Config,
    ensure_test_database_exists: None,
):
    command.upgrade(alembic_config, "head")
    engine = create_database_engine(settings.test_database_url)
    yield engine
    engine.dispose()


@pytest.fixture(scope="session")
def test_session_factory():
    return create_session_factory(settings.test_database_url)


@pytest.fixture(autouse=True)
def clean_test_database(test_database_engine) -> None:
    with test_database_engine.begin() as connection:
        connection.execute(text("TRUNCATE TABLE recipes RESTART IDENTITY CASCADE"))


@pytest.fixture
def sql_repository(test_session_factory) -> SQLAlchemyRecipeRepository:
    return SQLAlchemyRecipeRepository(test_session_factory)


@pytest.fixture
def client(sql_repository: SQLAlchemyRecipeRepository) -> TestClient:
    app = create_app(repository=sql_repository)
    return TestClient(app)


@pytest.fixture
def seeded_client(sql_repository: SQLAlchemyRecipeRepository) -> TestClient:
    sql_repository.create(build_recipe(1))
    sql_repository.create(build_recipe(2))
    repository = sql_repository
    app = create_app(repository=repository)
    return TestClient(app)

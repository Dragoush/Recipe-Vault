import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.repositories.in_memory_recipe_repository import InMemoryRecipeRepository
from tests.factories import build_recipe


@pytest.fixture
def client() -> TestClient:
    app = create_app(repository=InMemoryRecipeRepository())
    return TestClient(app)


@pytest.fixture
def seeded_client() -> TestClient:
    repository = InMemoryRecipeRepository([build_recipe(1), build_recipe(2)])
    app = create_app(repository=repository)
    return TestClient(app)

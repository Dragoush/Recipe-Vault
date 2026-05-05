from fastapi.testclient import TestClient

from app.main import create_app
from app.repositories.in_memory_recipe_repository import InMemoryRecipeRepository
from tests.factories import build_recipe


def test_statistics_endpoint_returns_empty_payload_shape(client: TestClient):
    response = client.get("/api/recipes/statistics")

    assert response.status_code == 200
    assert response.json() == {
        "totalRecipes": 0,
        "countsByCategory": {},
        "countsByDifficulty": {},
        "averagePrepTimeMinutes": 0.0,
        "averageCookTimeMinutes": 0.0,
        "averageTotalTimeMinutes": 0.0,
    }


def test_statistics_endpoint_returns_aggregated_values():
    repository = InMemoryRecipeRepository(
        [
            build_recipe(1, category="Breakfast", difficulty="Easy", prep_time_minutes=10, cook_time_minutes=20, total_time_minutes=30),
            build_recipe(2, category="Dinner", difficulty="Medium", prep_time_minutes=20, cook_time_minutes=30, total_time_minutes=50),
            build_recipe(3, category="Dinner", difficulty="Easy", prep_time_minutes=30, cook_time_minutes=40, total_time_minutes=70),
        ]
    )
    client = TestClient(create_app(repository=repository))

    response = client.get("/api/recipes/statistics")

    assert response.status_code == 200
    assert response.json() == {
        "totalRecipes": 3,
        "countsByCategory": {"Breakfast": 1, "Dinner": 2},
        "countsByDifficulty": {"Easy": 2, "Medium": 1},
        "averagePrepTimeMinutes": 20.0,
        "averageCookTimeMinutes": 30.0,
        "averageTotalTimeMinutes": 50.0,
    }

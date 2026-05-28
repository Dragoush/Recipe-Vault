from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import create_app
from tests.factories import build_recipe

STATISTICS_PATH = f"{settings.api_prefix}/recipes/statistics"


def test_statistics_endpoint_returns_empty_payload_shape(memory_client: TestClient):
    response = memory_client.get(STATISTICS_PATH)

    assert response.status_code == 200
    assert response.json() == {
        "totalRecipes": 0,
        "countsByCategory": {},
        "countsByDifficulty": {},
        "averagePrepTimeMinutes": 0.0,
        "averageCookTimeMinutes": 0.0,
        "averageTotalTimeMinutes": 0.0,
    }


def test_statistics_endpoint_returns_aggregated_values(
    memory_repository,
    authenticated_client_factory,
):
    memory_repository.create(
        build_recipe(
            1,
            category="Breakfast",
            difficulty="Easy",
            prep_time_minutes=10,
            cook_time_minutes=20,
            total_time_minutes=30,
        )
    )
    memory_repository.create(
        build_recipe(
            2,
            category="Dinner",
            difficulty="Medium",
            prep_time_minutes=20,
            cook_time_minutes=30,
            total_time_minutes=50,
        )
    )
    memory_repository.create(
        build_recipe(
            3,
            category="Dinner",
            difficulty="Easy",
            prep_time_minutes=30,
            cook_time_minutes=40,
            total_time_minutes=70,
        )
    )
    repository = memory_repository
    client = authenticated_client_factory(repository)

    response = client.get(STATISTICS_PATH)

    assert response.status_code == 200
    assert response.json() == {
        "totalRecipes": 3,
        "countsByCategory": {"Breakfast": 1, "Dinner": 2},
        "countsByDifficulty": {"Easy": 2, "Medium": 1},
        "averagePrepTimeMinutes": 20.0,
        "averageCookTimeMinutes": 30.0,
        "averageTotalTimeMinutes": 50.0,
    }

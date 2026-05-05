from fastapi.testclient import TestClient

from app.main import create_app
from app.repositories.in_memory_recipe_repository import InMemoryRecipeRepository
from tests.factories import build_recipe, build_recipe_payload


def test_root_endpoint_returns_backend_identity(client: TestClient):
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {"message": "Recipe Vault API"}


def test_recipe_crud_flow_stays_decoupled_from_frontend(seeded_client: TestClient):
    create_response = seeded_client.post("/api/recipes", json=build_recipe_payload())

    assert create_response.status_code == 201
    created_recipe = create_response.json()
    assert "prepTimeMinutes" in created_recipe
    assert "createdAt" in created_recipe
    assert "prep_time_minutes" not in created_recipe

    recipe_id = created_recipe["id"]

    get_response = seeded_client.get(f"/api/recipes/{recipe_id}")
    assert get_response.status_code == 200
    assert get_response.json()["title"] == "Roasted Potatoes"

    update_response = seeded_client.put(
        f"/api/recipes/{recipe_id}",
        json=build_recipe_payload(
            title="Updated Potatoes",
            difficulty="Medium",
            ingredients=["Potatoes", "Salt"],
            instructions=["Season the potatoes.", "Roast until crisp."],
        ),
    )
    assert update_response.status_code == 200
    assert update_response.json()["title"] == "Updated Potatoes"
    assert update_response.json()["difficulty"] == "Medium"

    delete_response = seeded_client.delete(f"/api/recipes/{recipe_id}")
    assert delete_response.status_code == 204
    assert delete_response.text == ""

    missing_response = seeded_client.get(f"/api/recipes/{recipe_id}")
    assert missing_response.status_code == 404
    assert missing_response.json()["detail"] == f'Recipe "{recipe_id}" was not found.'


def test_list_endpoint_returns_paginated_metadata_and_clamped_page():
    repository = InMemoryRecipeRepository(
        [build_recipe(1), build_recipe(2), build_recipe(3), build_recipe(4), build_recipe(5)]
    )
    client = TestClient(create_app(repository=repository))

    response = client.get("/api/recipes", params={"page": 99, "pageSize": 2})

    assert response.status_code == 200
    body = response.json()
    assert body["page"] == 3
    assert body["pageSize"] == 2
    assert body["totalItems"] == 5
    assert body["totalPages"] == 3
    assert [item["id"] for item in body["items"]] == ["recipe-5"]


def test_list_endpoint_rejects_invalid_pagination_values(seeded_client: TestClient):
    response = seeded_client.get("/api/recipes", params={"page": 0, "pageSize": 2})

    assert response.status_code == 422
    assert response.json()["detail"] == "Page must be at least 1."

from fastapi.testclient import TestClient

from app.main import create_app
from app.repositories.in_memory_recipe_repository import InMemoryRecipeRepository
from tests.factories import build_recipe_payload


def make_client() -> TestClient:
    return TestClient(create_app(repository=InMemoryRecipeRepository()))


def test_rejects_unknown_fields_in_recipe_payload():
    client = make_client()

    response = client.post(
        "/api/recipes",
        json=build_recipe_payload(unexpectedField="not allowed"),
    )

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"][-1] == "unexpectedField"


def test_rejects_recipe_payloads_with_invalid_lists_after_trimming():
    client = make_client()

    response = client.post(
        "/api/recipes",
        json=build_recipe_payload(
            ingredients=["Potatoes", "   "],
            instructions=["  ", "Bake until crisp."],
        ),
    )

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert any(issue["loc"][-1] == "ingredients" for issue in detail)
    assert any(issue["loc"][-1] == "instructions" for issue in detail)


def test_rejects_recipe_payloads_with_invalid_numbers_and_enums():
    client = make_client()

    response = client.post(
        "/api/recipes",
        json=build_recipe_payload(
            category="Brunch",
            difficulty="Expert",
            servings=0,
            prepTimeMinutes=-1,
        ),
    )

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert any(issue["loc"][-1] == "category" for issue in detail)
    assert any(issue["loc"][-1] == "difficulty" for issue in detail)
    assert any(issue["loc"][-1] == "servings" for issue in detail)
    assert any(issue["loc"][-1] in {"prepTimeMinutes", "prep_time_minutes"} for issue in detail)


def test_rejects_non_string_text_and_non_string_collection_entries():
    client = make_client()

    response = client.post(
        "/api/recipes",
        json=build_recipe_payload(
            title=123,
            ingredients=[1, "Salt"],
        ),
    )

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert any(issue["loc"][-1] == "title" for issue in detail)
    assert any(issue["loc"][-1] == "ingredients" for issue in detail)


def test_rejects_non_list_collection_payloads():
    client = make_client()

    response = client.post(
        "/api/recipes",
        json=build_recipe_payload(ingredients="Potatoes"),
    )

    assert response.status_code == 422
    assert any(issue["loc"][-1] == "ingredients" for issue in response.json()["detail"])

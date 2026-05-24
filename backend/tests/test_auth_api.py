from fastapi.testclient import TestClient

from app.main import create_app
from app.repositories.in_memory_recipe_repository import InMemoryRecipeRepository
from tests.fakes import FakeAuthRepository


def make_auth_client() -> TestClient:
    return TestClient(
        create_app(
            repository=InMemoryRecipeRepository(),
            auth_repository=FakeAuthRepository(),
        )
    )


def test_register_login_me_refresh_and_logout_flow():
    client = make_auth_client()

    register_response = client.post(
        "/api/auth/register",
        json={"username": "test_user", "password": "password123"},
    )

    assert register_response.status_code == 201
    assert register_response.json()["username"] == "test_user"
    assert register_response.json()["role"] == "USER"

    login_response = client.post(
        "/api/auth/login",
        json={"username": "test_user", "password": "password123"},
    )

    assert login_response.status_code == 200
    login_body = login_response.json()
    access_token = login_body["accessToken"]
    refresh_token = login_body["refreshToken"]
    assert access_token
    assert refresh_token

    me_response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )

    assert me_response.status_code == 200
    assert me_response.json()["username"] == "test_user"

    refresh_response = client.post(
        "/api/auth/refresh",
        json={"refreshToken": refresh_token},
    )

    assert refresh_response.status_code == 200
    refreshed_body = refresh_response.json()
    assert refreshed_body["refreshToken"] != refresh_token
    assert refreshed_body["accessToken"]

    logout_response = client.post(
        "/api/auth/logout",
        headers={"Authorization": f"Bearer {refreshed_body['accessToken']}"},
    )

    assert logout_response.status_code == 204

    me_after_logout = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {refreshed_body['accessToken']}"},
    )

    assert me_after_logout.status_code == 401


def test_register_rejects_duplicate_username():
    client = make_auth_client()

    first_response = client.post(
        "/api/auth/register",
        json={"username": "test_user", "password": "password123"},
    )
    duplicate_response = client.post(
        "/api/auth/register",
        json={"username": "TEST_USER", "password": "password123"},
    )

    assert first_response.status_code == 201
    assert duplicate_response.status_code == 409
    assert 'Username "test_user"' in duplicate_response.json()["detail"]


def test_login_rejects_invalid_credentials():
    client = make_auth_client()
    client.post(
        "/api/auth/register",
        json={"username": "test_user", "password": "password123"},
    )

    response = client.post(
        "/api/auth/login",
        json={"username": "test_user", "password": "wrongpass123"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid username or password."


def test_me_requires_authentication():
    client = make_auth_client()

    response = client.get("/api/auth/me")

    assert response.status_code == 401
    assert response.json()["detail"] == "Authentication required."

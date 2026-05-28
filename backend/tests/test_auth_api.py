from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import create_app
from app.repositories.in_memory_recipe_repository import InMemoryRecipeRepository
from tests.fakes import FakeAuthRepository

AUTH_BASE_PATH = f"{settings.api_prefix}/auth"


def make_auth_client() -> TestClient:
    return TestClient(
        create_app(
            repository=InMemoryRecipeRepository(),
            auth_repository=FakeAuthRepository(),
        ),
        base_url="https://testserver",
    )


def test_register_login_me_refresh_and_logout_flow():
    client = make_auth_client()

    register_response = client.post(
        f"{AUTH_BASE_PATH}/register",
        json={"username": "test_user", "password": "password123"},
    )

    assert register_response.status_code == 201
    assert register_response.json()["username"] == "test_user"
    assert register_response.json()["role"] == "USER"

    login_response = client.post(
        f"{AUTH_BASE_PATH}/login",
        json={"username": "test_user", "password": "password123"},
    )

    assert login_response.status_code == 200
    login_body = login_response.json()
    access_token = login_body["accessToken"]
    assert access_token
    assert "refreshToken" not in login_body
    assert login_response.cookies.get(settings.auth_refresh_cookie_name)

    me_response = client.get(
        f"{AUTH_BASE_PATH}/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )

    assert me_response.status_code == 200
    assert me_response.json()["username"] == "test_user"

    refresh_cookie = login_response.cookies.get(settings.auth_refresh_cookie_name)
    refresh_response = client.post(f"{AUTH_BASE_PATH}/refresh")

    assert refresh_response.status_code == 200
    refreshed_body = refresh_response.json()
    assert "refreshToken" not in refreshed_body
    assert refreshed_body["accessToken"]
    assert refresh_response.cookies.get(settings.auth_refresh_cookie_name) != refresh_cookie

    logout_response = client.post(
        f"{AUTH_BASE_PATH}/logout",
        headers={"Authorization": f"Bearer {refreshed_body['accessToken']}"},
    )

    assert logout_response.status_code == 204
    assert client.cookies.get(settings.auth_refresh_cookie_name) is None
    assert "Max-Age=0" in logout_response.headers["set-cookie"]

    me_after_logout = client.get(
        f"{AUTH_BASE_PATH}/me",
        headers={"Authorization": f"Bearer {refreshed_body['accessToken']}"},
    )

    assert me_after_logout.status_code == 401


def test_refresh_requires_refresh_cookie():
    client = make_auth_client()

    response = client.post(f"{AUTH_BASE_PATH}/refresh")

    assert response.status_code == 401
    assert response.json()["detail"] == "Refresh token is missing."


def test_register_rejects_duplicate_username():
    client = make_auth_client()

    first_response = client.post(
        f"{AUTH_BASE_PATH}/register",
        json={"username": "test_user", "password": "password123"},
    )
    duplicate_response = client.post(
        f"{AUTH_BASE_PATH}/register",
        json={"username": "TEST_USER", "password": "password123"},
    )

    assert first_response.status_code == 201
    assert duplicate_response.status_code == 409
    assert 'Username "test_user"' in duplicate_response.json()["detail"]


def test_login_rejects_invalid_credentials():
    client = make_auth_client()
    client.post(
        f"{AUTH_BASE_PATH}/register",
        json={"username": "test_user", "password": "password123"},
    )

    response = client.post(
        f"{AUTH_BASE_PATH}/login",
        json={"username": "test_user", "password": "wrongpass123"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid username or password."


def test_me_requires_authentication():
    client = make_auth_client()

    response = client.get(f"{AUTH_BASE_PATH}/me")

    assert response.status_code == 401
    assert response.json()["detail"] == "Authentication required."

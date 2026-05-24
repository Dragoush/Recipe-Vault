from app.domain.auth import AuthSession, AuthTokens, AuthenticatedSession, User, UserRole
from app.domain.recipe import Recipe, RecipeCategory, RecipeDifficulty

DEFAULT_OWNER_USER_ID = "user-test-owner"
DEFAULT_USERNAME = "test_user"


def build_recipe(index: int = 1, **overrides) -> Recipe:
    payload = {
        "id": f"recipe-{index}",
        "owner_user_id": DEFAULT_OWNER_USER_ID,
        "title": f"Recipe {index}",
        "category": RecipeCategory.DINNER,
        "difficulty": RecipeDifficulty.EASY,
        "servings": 2,
        "prep_time_minutes": 10 + index,
        "cook_time_minutes": 20 + index,
        "total_time_minutes": 30 + (index * 2),
        "description": f"Recipe {index} description that is comfortably long.",
        "ingredients": ["Ingredient A", "Ingredient B"],
        "instructions": ["Step one", "Step two"],
        "created_at": f"2026-04-{index:02d}T08:00:00.000Z",
        "updated_at": f"2026-04-{index:02d}T08:00:00.000Z",
    }
    payload.update(overrides)

    if isinstance(payload["category"], str):
        payload["category"] = RecipeCategory(payload["category"])

    if isinstance(payload["difficulty"], str):
        payload["difficulty"] = RecipeDifficulty(payload["difficulty"])

    return Recipe(**payload)


def build_recipe_payload(**overrides) -> dict:
    payload = {
        "title": "Roasted Potatoes",
        "category": "Dinner",
        "difficulty": "Easy",
        "servings": 4,
        "prepTimeMinutes": 15,
        "cookTimeMinutes": 35,
        "description": "Crispy roasted potatoes with herbs and a golden finish.",
        "ingredients": ["Potatoes", "Olive oil", "Rosemary"],
        "instructions": ["Cut the potatoes.", "Roast until golden."],
    }
    payload.update(overrides)
    return payload


def build_user(**overrides) -> User:
    payload = {
        "id": DEFAULT_OWNER_USER_ID,
        "username": DEFAULT_USERNAME,
        "password_hash": "pbkdf2_sha256$test$test$test",
        "role": UserRole.USER,
        "created_at": "2026-04-01T08:00:00.000Z",
        "updated_at": "2026-04-01T08:00:00.000Z",
    }
    payload.update(overrides)

    if isinstance(payload["role"], str):
        payload["role"] = UserRole(payload["role"])

    return User(**payload)


def build_auth_session(**overrides) -> AuthSession:
    payload = {
        "id": "session-test-owner",
        "user_id": DEFAULT_OWNER_USER_ID,
        "refresh_token_hash": "refresh-hash",
        "created_at": "2026-04-01T08:00:00.000Z",
        "last_activity_at": "2026-04-01T08:00:00.000Z",
        "expires_at": "2026-04-08T08:00:00.000Z",
        "revoked_at": None,
    }
    payload.update(overrides)
    return AuthSession(**payload)


def build_authenticated_session(**overrides) -> AuthenticatedSession:
    user = overrides.pop("user", build_user())
    session = overrides.pop("session", build_auth_session(user_id=user.id))
    tokens = overrides.pop(
        "tokens",
        AuthTokens(
            access_token="access-token",
            refresh_token="refresh-token",
            token_type="bearer",
            access_token_expires_in=900,
        ),
    )
    return AuthenticatedSession(user=user, session=session, tokens=tokens)

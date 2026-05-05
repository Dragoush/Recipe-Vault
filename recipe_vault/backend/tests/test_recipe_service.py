import pytest

from app.core.errors import PaginationValidationError, RecipeNotFoundError
from app.repositories.in_memory_recipe_repository import InMemoryRecipeRepository
from app.repositories.recipe_repository import RecipeRepository
from app.schemas.recipe import RecipeCreateRequest, RecipeUpdateRequest
from app.services.recipe_service import RecipeService
from tests.factories import build_recipe, build_recipe_payload


def test_create_recipe_computes_fields_ids_and_timestamps():
    repository = InMemoryRecipeRepository()
    service = RecipeService(
        repository=repository,
        id_generator=lambda: "recipe-generated",
        now_factory=lambda: "2026-05-04T12:00:00.000Z",
    )

    created_recipe = service.create_recipe(
        RecipeCreateRequest.model_validate(build_recipe_payload())
    )

    assert created_recipe.id == "recipe-generated"
    assert created_recipe.total_time_minutes == 50
    assert created_recipe.created_at == "2026-05-04T12:00:00.000Z"
    assert created_recipe.updated_at == "2026-05-04T12:00:00.000Z"
    assert repository.count() == 1


def test_list_recipes_uses_service_pagination_rules_and_clamps_page():
    repository = InMemoryRecipeRepository(
        [build_recipe(1), build_recipe(2), build_recipe(3), build_recipe(4), build_recipe(5)]
    )
    service = RecipeService(repository=repository, default_page_size=2, max_page_size=10)

    page = service.list_recipes(page=99, page_size=2)

    assert page.page == 3
    assert page.page_size == 2
    assert page.total_items == 5
    assert page.total_pages == 3
    assert [recipe.id for recipe in page.items] == ["recipe-5"]


@pytest.mark.parametrize(
    ("page", "page_size", "message"),
    [
        (0, 2, "Page must be at least 1."),
        (1, 0, "Page size must be at least 1."),
        (1, 51, "Page size must not exceed 50."),
    ],
)
def test_list_recipes_rejects_invalid_pagination_values(page, page_size, message):
    service = RecipeService(repository=InMemoryRecipeRepository())

    with pytest.raises(PaginationValidationError, match=message):
        service.list_recipes(page=page, page_size=page_size)


def test_update_recipe_preserves_created_at_and_refreshes_updated_at():
    repository = InMemoryRecipeRepository(
        [build_recipe(1, created_at="2026-04-01T08:00:00.000Z", updated_at="2026-04-01T08:00:00.000Z")]
    )
    service = RecipeService(
        repository=repository,
        now_factory=lambda: "2026-05-04T12:30:00.000Z",
    )

    updated_recipe = service.update_recipe(
        "recipe-1",
        RecipeUpdateRequest.model_validate(
            build_recipe_payload(
                title="Updated Potatoes",
                ingredients=["Potatoes", "Olive oil"],
                instructions=["Mix everything.", "Bake until crisp."],
            )
        ),
    )

    assert updated_recipe.title == "Updated Potatoes"
    assert updated_recipe.created_at == "2026-04-01T08:00:00.000Z"
    assert updated_recipe.updated_at == "2026-05-04T12:30:00.000Z"


def test_get_and_delete_raise_when_recipe_is_missing():
    service = RecipeService(repository=InMemoryRecipeRepository())

    with pytest.raises(RecipeNotFoundError, match='Recipe "missing" was not found.'):
        service.get_recipe("missing")

    with pytest.raises(RecipeNotFoundError, match='Recipe "missing" was not found.'):
        service.delete_recipe("missing")

    with pytest.raises(RecipeNotFoundError, match='Recipe "missing" was not found.'):
        service.update_recipe(
            "missing",
            RecipeUpdateRequest.model_validate(build_recipe_payload()),
        )


class VanishingRecipeRepository(RecipeRepository):
    def count(self) -> int:
        return 1

    def list_slice(self, offset: int, limit: int) -> list:
        return []

    def list_all(self) -> list:
        return []

    def get_by_id(self, recipe_id: str):
        return build_recipe(1, id=recipe_id)

    def create(self, recipe):
        return recipe

    def update(self, recipe):
        return None

    def delete(self, recipe_id: str) -> bool:
        return True


def test_update_recipe_raises_if_repository_loses_recipe_mid_update():
    service = RecipeService(repository=VanishingRecipeRepository())

    with pytest.raises(RecipeNotFoundError, match='Recipe "recipe-1" was not found.'):
        service.update_recipe(
            "recipe-1",
            RecipeUpdateRequest.model_validate(build_recipe_payload()),
        )

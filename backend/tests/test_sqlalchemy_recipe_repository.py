import pytest

from app.repositories.api_recipe_repository import ApiRecipeRepository
from app.schemas.filters import RecipeListFilters
from tests.factories import build_recipe

pytestmark = pytest.mark.database


def test_sqlalchemy_repository_persists_recipe_children_and_timestamps(
    sql_repository: ApiRecipeRepository,
):
    created_recipe = sql_repository.create(
        build_recipe(
            1,
            ingredients=["Potatoes", "Olive oil", "Rosemary"],
            instructions=["Cut the potatoes.", "Roast until crisp."],
        )
    )

    stored_recipe = sql_repository.get_by_id(created_recipe.id)

    assert stored_recipe is not None
    assert stored_recipe.ingredients == ["Potatoes", "Olive oil", "Rosemary"]
    assert stored_recipe.instructions == ["Cut the potatoes.", "Roast until crisp."]
    assert stored_recipe.created_at == "2026-04-01T08:00:00.000Z"
    assert stored_recipe.total_time_minutes == 32


def test_sqlalchemy_repository_supports_ordering_filters_updates_and_deletes(
    sql_repository: ApiRecipeRepository,
):
    sql_repository.create(
        build_recipe(
            1,
            title="Bright Breakfast Bowl",
            category="Breakfast",
            difficulty="Easy",
            description="A colorful morning bowl with fruit and yogurt.",
        )
    )
    sql_repository.create(
        build_recipe(
            2,
            title="Slow Braised Dinner",
            category="Dinner",
            difficulty="Hard",
            description="A rich and slow-cooked dinner for the weekend.",
        )
    )

    filtered_recipes = sql_repository.list_all(
        RecipeListFilters(category="Dinner", search="slow")
    )

    assert [recipe.id for recipe in filtered_recipes] == ["recipe-2"]

    updated_recipe = sql_repository.update(
        build_recipe(
            2,
            title="Slow Braised Dinner Updated",
            category="Dinner",
            difficulty="Medium",
            ingredients=["Beef", "Stock"],
            instructions=["Brown the beef.", "Simmer slowly."],
        )
    )

    assert updated_recipe is not None
    assert updated_recipe.title == "Slow Braised Dinner Updated"
    assert updated_recipe.difficulty.value == "Medium"
    assert updated_recipe.ingredients == ["Beef", "Stock"]
    assert sql_repository.delete("recipe-1") is True
    assert sql_repository.delete("missing") is False
    assert [recipe.id for recipe in sql_repository.list_slice(0, 10)] == ["recipe-2"]

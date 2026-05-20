from app.repositories.in_memory_recipe_repository import InMemoryRecipeRepository
from tests.factories import build_recipe


def test_create_and_list_slice_keep_newest_first_order():
    repository = InMemoryRecipeRepository([build_recipe(1), build_recipe(2)])

    repository.create(build_recipe(3))

    recipes = repository.list_slice(0, 10)

    assert [recipe.id for recipe in recipes] == ["recipe-3", "recipe-1", "recipe-2"]
    assert repository.count() == 3


def test_get_by_id_returns_copy_instead_of_internal_reference():
    repository = InMemoryRecipeRepository([build_recipe(1)])

    recipe = repository.get_by_id("recipe-1")
    recipe.ingredients.append("Unexpected ingredient")

    stored_recipe = repository.get_by_id("recipe-1")

    assert stored_recipe.ingredients == ["Ingredient A", "Ingredient B"]
    assert repository.get_by_id("missing") is None
    assert InMemoryRecipeRepository._copy_recipe(None) is None


def test_update_replaces_recipe_and_delete_returns_expected_flags():
    repository = InMemoryRecipeRepository([build_recipe(1), build_recipe(2)])

    updated_recipe = build_recipe(1, title="Updated Recipe 1")

    stored_recipe = repository.update(updated_recipe)

    assert stored_recipe.title == "Updated Recipe 1"
    assert repository.get_by_id("recipe-1").title == "Updated Recipe 1"
    assert repository.delete("recipe-2") is True
    assert repository.delete("missing-recipe") is False
    assert repository.update(build_recipe(99)) is None
    assert [recipe.id for recipe in repository.list_all()] == ["recipe-1"]


def test_create_with_existing_id_replaces_recipe_and_moves_it_to_the_front():
    repository = InMemoryRecipeRepository([build_recipe(1), build_recipe(2)])

    repository.create(build_recipe(2, title="Recreated Recipe 2"))

    recipes = repository.list_all()

    assert [recipe.id for recipe in recipes] == ["recipe-2", "recipe-1"]
    assert recipes[0].title == "Recreated Recipe 2"

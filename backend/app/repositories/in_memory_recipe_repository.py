from dataclasses import replace
from typing import Iterable

from app.domain.recipe import Recipe
from app.repositories.recipe_repository import RecipeRepository
from app.schemas.filters import RecipeListFilters


class InMemoryRecipeRepository(RecipeRepository):
    def __init__(self, initial_recipes: Iterable[Recipe] | None = None):
        self._recipes: dict[str, Recipe] = {}
        self._ordered_ids: list[str] = []

        for recipe in initial_recipes or []:
            recipe_copy = self._copy_recipe(recipe)
            self._recipes[recipe_copy.id] = recipe_copy
            self._ordered_ids.append(recipe_copy.id)

    def count(
        self,
        owner_user_id: str,
        filters: RecipeListFilters | None = None,
    ) -> int:
        return len(self._filtered_ordered_ids(owner_user_id, filters))

    def list_slice(
        self,
        owner_user_id: str,
        offset: int,
        limit: int,
        filters: RecipeListFilters | None = None,
    ) -> list[Recipe]:
        ordered_ids = self._filtered_ordered_ids(owner_user_id, filters)
        recipe_ids = ordered_ids[offset : offset + limit]
        return [self._copy_recipe(self._recipes[recipe_id]) for recipe_id in recipe_ids]

    def list_all(
        self,
        owner_user_id: str,
        filters: RecipeListFilters | None = None,
    ) -> list[Recipe]:
        return [
            self._copy_recipe(self._recipes[recipe_id])
            for recipe_id in self._filtered_ordered_ids(owner_user_id, filters)
        ]

    def get_by_id(self, recipe_id: str, owner_user_id: str) -> Recipe | None:
        recipe = self._recipes.get(recipe_id)

        if recipe is None or recipe.owner_user_id != owner_user_id:
            return None

        return self._copy_recipe(recipe)

    def create(self, recipe: Recipe) -> Recipe:
        recipe_copy = self._copy_recipe(recipe)
        self._recipes[recipe_copy.id] = recipe_copy

        if recipe_copy.id in self._ordered_ids:
            self._ordered_ids.remove(recipe_copy.id)

        self._ordered_ids.insert(0, recipe_copy.id)
        return self._copy_recipe(recipe_copy)

    def update(self, recipe: Recipe) -> Recipe | None:
        existing_recipe = self._recipes.get(recipe.id)

        if existing_recipe is None or existing_recipe.owner_user_id != recipe.owner_user_id:
            return None

        recipe_copy = self._copy_recipe(recipe)
        self._recipes[recipe_copy.id] = recipe_copy
        return self._copy_recipe(recipe_copy)

    def delete(self, recipe_id: str, owner_user_id: str) -> bool:
        recipe = self._recipes.get(recipe_id)

        if recipe is None or recipe.owner_user_id != owner_user_id:
            return False

        del self._recipes[recipe_id]
        self._ordered_ids.remove(recipe_id)
        return True

    def _filtered_ordered_ids(
        self,
        owner_user_id: str,
        filters: RecipeListFilters | None,
    ) -> list[str]:
        filtered_ids: list[str] = []
        search_value = filters.search.lower() if filters and filters.search else None

        for recipe_id in self._ordered_ids:
            recipe = self._recipes[recipe_id]

            if recipe.owner_user_id != owner_user_id:
                continue

            if filters is not None and filters.category is not None and recipe.category != filters.category:
                continue

            if (
                filters is not None
                and filters.difficulty is not None
                and recipe.difficulty != filters.difficulty
            ):
                continue

            if search_value is not None:
                searchable_text = f"{recipe.title} {recipe.description}".lower()

                if search_value not in searchable_text:
                    continue

            filtered_ids.append(recipe_id)

        return filtered_ids

    @staticmethod
    def _copy_recipe(recipe: Recipe | None) -> Recipe | None:
        if recipe is None:
            return None

        return replace(
            recipe,
            ingredients=list(recipe.ingredients),
            instructions=list(recipe.instructions),
        )

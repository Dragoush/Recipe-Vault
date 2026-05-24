from abc import ABC, abstractmethod

from app.domain.recipe import Recipe
from app.schemas.filters import RecipeListFilters


class RecipeRepository(ABC):
    @abstractmethod
    def count(
        self,
        owner_user_id: str,
        filters: RecipeListFilters | None = None,
    ) -> int:
        """
        Return number of stored recipes
        """

    @abstractmethod
    def list_slice(
        self,
        owner_user_id: str,
        offset: int,
        limit: int,
        filters: RecipeListFilters | None = None,
    ) -> list[Recipe]:
        """
        Return a page of stored recipes
        """

    @abstractmethod
    def list_all(
        self,
        owner_user_id: str,
        filters: RecipeListFilters | None = None,
    ) -> list[Recipe]:
        """"""

    @abstractmethod
    def get_by_id(self, recipe_id: str, owner_user_id: str) -> Recipe | None:
        """Return recipe or None"""

    @abstractmethod
    def create(self, recipe: Recipe) -> Recipe:
        """Store and return a new recipe"""

    @abstractmethod
    def update(self, recipe: Recipe) -> Recipe | None:
        """Replace and return an existing recipe or None when it is missing"""

    @abstractmethod
    def delete(self, recipe_id: str, owner_user_id: str) -> bool:
        """Delete a recipe"""

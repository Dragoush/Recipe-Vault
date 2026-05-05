from abc import ABC, abstractmethod

from app.domain.recipe import Recipe


class RecipeRepository(ABC):
    @abstractmethod
    def count(self) -> int:
        """Return the total number of stored recipes."""

    @abstractmethod
    def list_slice(self, offset: int, limit: int) -> list[Recipe]:
        """Return a slice of stored recipes using the current repository order."""

    @abstractmethod
    def list_all(self) -> list[Recipe]:
        """Return all stored recipes using the current repository order."""

    @abstractmethod
    def get_by_id(self, recipe_id: str) -> Recipe | None:
        """Return a single recipe, or None when it is missing."""

    @abstractmethod
    def create(self, recipe: Recipe) -> Recipe:
        """Store and return a new recipe."""

    @abstractmethod
    def update(self, recipe: Recipe) -> Recipe | None:
        """Replace and return an existing recipe, or None when it is missing."""

    @abstractmethod
    def delete(self, recipe_id: str) -> bool:
        """Delete a recipe and return whether anything was removed."""

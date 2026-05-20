from pydantic import field_validator

from app.domain.recipe import RecipeCategory, RecipeDifficulty
from app.schemas.base import ApiSchema


class RecipeListFilters(ApiSchema):
    search: str | None = None
    category: RecipeCategory | None = None
    difficulty: RecipeDifficulty | None = None

    @field_validator("search", mode="before")
    @classmethod
    def normalize_search(cls, value: str | None) -> str | None:
        if not isinstance(value, str):
            return value

        normalized = value.strip()
        return normalized or None

    @property
    def is_empty(self) -> bool:
        return (
            self.search is None
            and self.category is None
            and self.difficulty is None
        )

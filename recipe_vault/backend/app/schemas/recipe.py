from pydantic import Field, ValidationInfo, field_validator

from app.domain.recipe import Recipe, RecipeCategory, RecipeDifficulty
from app.schemas.base import ApiSchema


class RecipePayload(ApiSchema):
    title: str = Field(min_length=3, max_length=60)
    category: RecipeCategory
    difficulty: RecipeDifficulty
    servings: int
    prep_time_minutes: int
    cook_time_minutes: int
    description: str = Field(min_length=12, max_length=260)
    ingredients: list[str]
    instructions: list[str]

    @field_validator("title", "description", mode="before")
    @classmethod
    def strip_text(cls, value: str) -> str:
        if isinstance(value, str):
            return value.strip()

        return value

    @field_validator("servings")
    @classmethod
    def validate_servings(cls, value: int) -> int:
        if value < 1 or value > 24:
            raise ValueError("Servings must be between 1 and 24.")

        return value

    @field_validator("prep_time_minutes", "cook_time_minutes")
    @classmethod
    def validate_time_minutes(cls, value: int) -> int:
        if value < 0 or value > 600:
            raise ValueError("Time values must be between 0 and 600 minutes.")

        return value

    @field_validator("ingredients", "instructions", mode="before")
    @classmethod
    def normalize_entries(
        cls,
        value: object,
        info: ValidationInfo,
    ) -> list[str]:
        if not isinstance(value, list):
            return value

        normalized: list[str] = []

        for entry in value:
            if not isinstance(entry, str):
                raise ValueError("Entries must be strings.")

            stripped_entry = entry.strip()

            if stripped_entry:
                normalized.append(stripped_entry)

        if len(normalized) >= 2:
            return normalized

        if info.field_name == "ingredients":
            raise ValueError("Add at least 2 ingredients.")

        raise ValueError("Add at least 2 preparation steps.")


class RecipeCreateRequest(RecipePayload):
    pass


class RecipeUpdateRequest(RecipePayload):
    pass


class RecipeResponse(ApiSchema):
    id: str
    title: str
    category: RecipeCategory
    difficulty: RecipeDifficulty
    servings: int
    prep_time_minutes: int
    cook_time_minutes: int
    total_time_minutes: int
    description: str
    ingredients: list[str]
    instructions: list[str]
    created_at: str
    updated_at: str

    @classmethod
    def from_recipe(cls, recipe: Recipe) -> "RecipeResponse":
        return cls.model_validate(recipe)

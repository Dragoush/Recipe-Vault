import math
import uuid
from collections.abc import Callable
from datetime import datetime, timezone

from app.core.config import settings
from app.core.errors import PaginationValidationError, RecipeNotFoundError
from app.domain.recipe import Recipe
from app.repositories.recipe_repository import RecipeRepository
from app.schemas.filters import RecipeListFilters
from app.schemas.pagination import PaginatedRecipesResponse
from app.schemas.recipe import (
    RecipeCreateRequest,
    RecipeResponse,
    RecipeUpdateRequest,
)


def generate_recipe_id() -> str:
    return f"recipe-{uuid.uuid4()}"


def utc_now_iso_timestamp() -> str:
    return (
        datetime.now(timezone.utc)
        .isoformat(timespec="milliseconds")
        .replace("+00:00", "Z")
    )


class RecipeService:
    def __init__(
        self,
        repository: RecipeRepository,
        default_page_size: int = settings.default_page_size,
        max_page_size: int = settings.max_page_size,
        id_generator: Callable[[], str] = generate_recipe_id,
        now_factory: Callable[[], str] = utc_now_iso_timestamp,
    ):
        self.repository = repository
        self.default_page_size = default_page_size
        self.max_page_size = max_page_size
        self.id_generator = id_generator
        self.now_factory = now_factory

    def list_recipes(
        self,
        page: int = 1,
        page_size: int | None = None,
        filters: RecipeListFilters | None = None,
    ) -> PaginatedRecipesResponse:
        resolved_page_size = (
            self.default_page_size if page_size is None else page_size
        )
        resolved_filters = None if filters is None or filters.is_empty else filters

        if page < 1:
            raise PaginationValidationError("Page must be at least 1.")

        if resolved_page_size < 1:
            raise PaginationValidationError("Page size must be at least 1.")

        if resolved_page_size > self.max_page_size:
            raise PaginationValidationError(
                f"Page size must not exceed {self.max_page_size}."
            )

        total_items = self.repository.count(resolved_filters)
        total_pages = max(1, math.ceil(total_items / resolved_page_size))
        current_page = min(page, total_pages)
        offset = (current_page - 1) * resolved_page_size
        recipes = self.repository.list_slice(
            offset,
            resolved_page_size,
            resolved_filters,
        )

        return PaginatedRecipesResponse(
            items=[RecipeResponse.from_recipe(recipe) for recipe in recipes],
            page=current_page,
            page_size=resolved_page_size,
            total_items=total_items,
            total_pages=total_pages,
        )

    def get_recipe(self, recipe_id: str) -> RecipeResponse:
        recipe = self.repository.get_by_id(recipe_id)

        if recipe is None:
            raise RecipeNotFoundError(recipe_id)

        return RecipeResponse.from_recipe(recipe)

    def create_recipe(self, payload: RecipeCreateRequest) -> RecipeResponse:
        timestamp = self.now_factory()
        recipe = self._build_recipe(
            payload=payload,
            recipe_id=self.id_generator(),
            created_at=timestamp,
            updated_at=timestamp,
        )
        created_recipe = self.repository.create(recipe)
        return RecipeResponse.from_recipe(created_recipe)

    def update_recipe(
        self,
        recipe_id: str,
        payload: RecipeUpdateRequest,
    ) -> RecipeResponse:
        existing_recipe = self.repository.get_by_id(recipe_id)

        if existing_recipe is None:
            raise RecipeNotFoundError(recipe_id)

        updated_recipe = self._build_recipe(
            payload=payload,
            recipe_id=existing_recipe.id,
            created_at=existing_recipe.created_at,
            updated_at=self.now_factory(),
        )
        stored_recipe = self.repository.update(updated_recipe)

        if stored_recipe is None:
            raise RecipeNotFoundError(recipe_id)

        return RecipeResponse.from_recipe(stored_recipe)

    def delete_recipe(self, recipe_id: str) -> None:
        was_deleted = self.repository.delete(recipe_id)

        if not was_deleted:
            raise RecipeNotFoundError(recipe_id)

    @staticmethod
    def _build_recipe(
        payload: RecipeCreateRequest | RecipeUpdateRequest,
        recipe_id: str,
        created_at: str,
        updated_at: str,
    ) -> Recipe:
        return Recipe(
            id=recipe_id,
            title=payload.title,
            category=payload.category,
            difficulty=payload.difficulty,
            servings=payload.servings,
            prep_time_minutes=payload.prep_time_minutes,
            cook_time_minutes=payload.cook_time_minutes,
            total_time_minutes=payload.prep_time_minutes + payload.cook_time_minutes,
            description=payload.description,
            ingredients=list(payload.ingredients),
            instructions=list(payload.instructions),
            created_at=created_at,
            updated_at=updated_at,
        )

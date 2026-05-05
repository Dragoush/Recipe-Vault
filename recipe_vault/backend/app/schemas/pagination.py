from app.schemas.base import ApiSchema
from app.schemas.recipe import RecipeResponse


class PaginatedRecipesResponse(ApiSchema):
    items: list[RecipeResponse]
    page: int
    page_size: int
    total_items: int
    total_pages: int

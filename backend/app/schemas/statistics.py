from app.schemas.base import ApiSchema


class RecipeStatisticsResponse(ApiSchema):
    total_recipes: int
    counts_by_category: dict[str, int]
    counts_by_difficulty: dict[str, int]
    average_prep_time_minutes: float
    average_cook_time_minutes: float
    average_total_time_minutes: float

from collections import Counter
from statistics import mean

from app.repositories.recipe_repository import RecipeRepository
from app.schemas.statistics import RecipeStatisticsResponse


class StatisticsService:
    def __init__(self, repository: RecipeRepository):
        self.repository = repository

    def get_statistics(self) -> RecipeStatisticsResponse:
        recipes = self.repository.list_all()

        if not recipes:
            return RecipeStatisticsResponse(
                total_recipes=0,
                counts_by_category={},
                counts_by_difficulty={},
                average_prep_time_minutes=0.0,
                average_cook_time_minutes=0.0,
                average_total_time_minutes=0.0,
            )

        category_counts = Counter(recipe.category.value for recipe in recipes)
        difficulty_counts = Counter(recipe.difficulty.value for recipe in recipes)

        return RecipeStatisticsResponse(
            total_recipes=len(recipes),
            counts_by_category=dict(sorted(category_counts.items())),
            counts_by_difficulty=dict(sorted(difficulty_counts.items())),
            average_prep_time_minutes=round(
                mean(recipe.prep_time_minutes for recipe in recipes), 2
            ),
            average_cook_time_minutes=round(
                mean(recipe.cook_time_minutes for recipe in recipes), 2
            ),
            average_total_time_minutes=round(
                mean(recipe.total_time_minutes for recipe in recipes), 2
            ),
        )

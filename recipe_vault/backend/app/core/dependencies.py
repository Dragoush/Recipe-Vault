from fastapi import Depends, Request

from app.repositories.recipe_repository import RecipeRepository
from app.services.recipe_service import RecipeService
from app.services.statistics_service import StatisticsService


def get_recipe_repository(request: Request) -> RecipeRepository:
    return request.app.state.recipe_repository


def get_recipe_service(
    repository: RecipeRepository = Depends(get_recipe_repository),
) -> RecipeService:
    return RecipeService(repository=repository)


def get_statistics_service(
    repository: RecipeRepository = Depends(get_recipe_repository),
) -> StatisticsService:
    return StatisticsService(repository=repository)

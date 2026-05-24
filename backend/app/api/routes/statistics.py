from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_auth_context, get_statistics_service
from app.schemas.statistics import RecipeStatisticsResponse
from app.services.statistics_service import StatisticsService

router = APIRouter(prefix="/recipes", tags=["statistics"])


@router.get("/statistics", response_model=RecipeStatisticsResponse)
def get_recipe_statistics(
    auth_context=Depends(get_current_auth_context),
    service: StatisticsService = Depends(get_statistics_service),
) -> RecipeStatisticsResponse:
    return service.get_statistics(auth_context.user)

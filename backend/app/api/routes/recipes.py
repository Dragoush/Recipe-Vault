from fastapi import APIRouter, Depends, Query, Response, status

from app.core.config import settings
from app.core.dependencies import get_current_auth_context, get_recipe_service
from app.schemas.filters import RecipeListFilters
from app.schemas.pagination import PaginatedRecipesResponse
from app.schemas.recipe import (
    RecipeCreateRequest,
    RecipeResponse,
    RecipeUpdateRequest,
)
from app.services.recipe_service import RecipeService

router = APIRouter(prefix="/recipes", tags=["recipes"])


@router.post("", response_model=RecipeResponse, status_code=status.HTTP_201_CREATED)
def create_recipe(
    payload: RecipeCreateRequest,
    auth_context=Depends(get_current_auth_context),
    service: RecipeService = Depends(get_recipe_service),
) -> RecipeResponse:
    return service.create_recipe(auth_context.user, payload)


@router.get("", response_model=PaginatedRecipesResponse)
def list_recipes(
    page: int = Query(default=1),
    page_size: int = Query(default=settings.default_page_size, alias="pageSize"),
    filters: RecipeListFilters = Depends(),
    auth_context=Depends(get_current_auth_context),
    service: RecipeService = Depends(get_recipe_service),
) -> PaginatedRecipesResponse:
    return service.list_recipes(
        current_user=auth_context.user,
        page=page,
        page_size=page_size,
        filters=filters,
    )


@router.get("/{recipe_id}", response_model=RecipeResponse)
def get_recipe(
    recipe_id: str,
    auth_context=Depends(get_current_auth_context),
    service: RecipeService = Depends(get_recipe_service),
) -> RecipeResponse:
    return service.get_recipe(auth_context.user, recipe_id)


@router.put("/{recipe_id}", response_model=RecipeResponse)
def update_recipe(
    recipe_id: str,
    payload: RecipeUpdateRequest,
    auth_context=Depends(get_current_auth_context),
    service: RecipeService = Depends(get_recipe_service),
) -> RecipeResponse:
    return service.update_recipe(auth_context.user, recipe_id, payload)


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recipe(
    recipe_id: str,
    auth_context=Depends(get_current_auth_context),
    service: RecipeService = Depends(get_recipe_service),
) -> Response:
    service.delete_recipe(auth_context.user, recipe_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.errors import AuthenticationError
from app.domain.auth import AuthContext, UserRole
from app.repositories.auth_repository import AuthRepository
from app.repositories.recipe_repository import RecipeRepository
from app.services.auth_service import AuthService
from app.services.recipe_service import RecipeService
from app.services.statistics_service import StatisticsService

bearer_scheme = HTTPBearer(auto_error=False)


def get_recipe_repository(request: Request) -> RecipeRepository:
    return request.app.state.recipe_repository


def get_auth_repository(request: Request) -> AuthRepository:
    return request.app.state.auth_repository


def get_auth_service(
    repository: AuthRepository = Depends(get_auth_repository),
) -> AuthService:
    return AuthService(repository=repository)


def get_recipe_service(
    repository: RecipeRepository = Depends(get_recipe_repository),
) -> RecipeService:
    return RecipeService(repository=repository)


def get_statistics_service(
    repository: RecipeRepository = Depends(get_recipe_repository),
) -> StatisticsService:
    return StatisticsService(repository=repository)


def get_current_auth_context(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    service: AuthService = Depends(get_auth_service),
) -> AuthContext:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise AuthenticationError()

    return service.authenticate_access_token(
        credentials.credentials,
        allowed_roles={UserRole.USER, UserRole.ADMIN},
    )

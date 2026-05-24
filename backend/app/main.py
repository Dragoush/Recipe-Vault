from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import auth, recipes, statistics
from app.core.config import settings
from app.core.errors import (
    AuthenticationError,
    AuthorizationError,
    PaginationValidationError,
    RecipeNotFoundError,
    UsernameConflictError,
)
from app.db.session import SessionFactory, database_engine
from app.repositories.auth_repository import AuthRepository
from app.repositories.recipe_repository import RecipeRepository
from app.repositories.api_recipe_repository import ApiRecipeRepository
from app.repositories.sqlalchemy_auth_repository import SQLAlchemyAuthRepository


def create_app(
    repository: RecipeRepository | None = None,
    auth_repository: AuthRepository | None = None,
) -> FastAPI:
    app = FastAPI(title=settings.app_name)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.state.recipe_repository = repository or ApiRecipeRepository(SessionFactory)
    app.state.auth_repository = auth_repository or SQLAlchemyAuthRepository(SessionFactory)
    app.state.database_engine = database_engine

    @app.exception_handler(RecipeNotFoundError)
    async def handle_recipe_not_found(
        _request: Request,
        exc: RecipeNotFoundError,
    ) -> JSONResponse:
        return JSONResponse(status_code=404, content={"detail": str(exc)})

    @app.exception_handler(PaginationValidationError)
    async def handle_pagination_validation_error(
        _request: Request,
        exc: PaginationValidationError,
    ) -> JSONResponse:
        return JSONResponse(status_code=422, content={"detail": str(exc)})

    @app.exception_handler(UsernameConflictError)
    async def handle_username_conflict_error(
        _request: Request,
        exc: UsernameConflictError,
    ) -> JSONResponse:
        return JSONResponse(status_code=409, content={"detail": str(exc)})

    @app.exception_handler(AuthenticationError)
    async def handle_authentication_error(
        _request: Request,
        exc: AuthenticationError,
    ) -> JSONResponse:
        return JSONResponse(status_code=401, content={"detail": str(exc)})

    @app.exception_handler(AuthorizationError)
    async def handle_authorization_error(
        _request: Request,
        exc: AuthorizationError,
    ) -> JSONResponse:
        return JSONResponse(status_code=403, content={"detail": str(exc)})

    @app.get("/")
    async def root() -> dict[str, str]:
        return {"message": settings.app_name}

    app.include_router(auth.router, prefix=settings.api_prefix)
    app.include_router(statistics.router, prefix=settings.api_prefix)
    app.include_router(recipes.router, prefix=settings.api_prefix)

    @app.on_event("shutdown")
    def dispose_database_engine() -> None:
        engine = getattr(app.state, "database_engine", None)

        if engine is not None:
            engine.dispose()

    return app


app = create_app()

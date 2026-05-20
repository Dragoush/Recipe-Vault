from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import recipes, statistics
from app.core.config import settings
from app.core.errors import PaginationValidationError, RecipeNotFoundError
from app.db.session import SessionFactory, database_engine
from app.repositories.in_memory_recipe_repository import InMemoryRecipeRepository
from app.repositories.recipe_repository import RecipeRepository
from app.repositories.sqlalchemy_recipe_repository import SQLAlchemyRecipeRepository


def create_app(repository: RecipeRepository | None = None) -> FastAPI:
    app = FastAPI(title=settings.app_name)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    if repository is not None:
        app.state.recipe_repository = repository
    elif settings.repository_backend == "memory":
        app.state.recipe_repository = InMemoryRecipeRepository()
    else:
        app.state.recipe_repository = SQLAlchemyRecipeRepository(SessionFactory)
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

    @app.get("/")
    async def root() -> dict[str, str]:
        return {"message": settings.app_name}

    app.include_router(statistics.router, prefix=settings.api_prefix)
    app.include_router(recipes.router, prefix=settings.api_prefix)

    @app.on_event("shutdown")
    def dispose_database_engine() -> None:
        engine = getattr(app.state, "database_engine", None)

        if engine is not None:
            engine.dispose()

    return app


app = create_app()

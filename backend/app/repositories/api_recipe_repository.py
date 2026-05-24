from datetime import datetime, timezone

from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session, joinedload, selectinload, sessionmaker

from app.db.models.category_model import CategoryModel
from app.db.models.difficulty_level_model import DifficultyLevelModel
from app.db.models.recipe_ingredient_line_model import RecipeIngredientLineModel
from app.db.models.recipe_instruction_step_model import RecipeInstructionStepModel
from app.db.models.recipe_model import RecipeModel
from app.domain.recipe import Recipe, RecipeCategory, RecipeDifficulty
from app.repositories.recipe_repository import RecipeRepository
from app.schemas.filters import RecipeListFilters


class ApiRecipeRepository(RecipeRepository):
    def __init__(self, session_factory: sessionmaker[Session]):
        self.session_factory = session_factory

    def count(
        self,
        owner_user_id: str,
        filters: RecipeListFilters | None = None,
    ) -> int:
        with self.session_factory() as session:
            statement = (
                select(func.count(RecipeModel.id))
                .select_from(RecipeModel)
                .where(RecipeModel.owner_user_id == owner_user_id)
            )
            statement = self._apply_filters(statement, filters)
            return int(session.scalar(statement) or 0)

    def list_slice(
        self,
        owner_user_id: str,
        offset: int,
        limit: int,
        filters: RecipeListFilters | None = None,
    ) -> list[Recipe]:
        with self.session_factory() as session:
            statement = (
                self._recipe_query()
                .where(RecipeModel.owner_user_id == owner_user_id)
                .order_by(RecipeModel.created_at.desc(), RecipeModel.id.desc())
                .offset(offset)
                .limit(limit)
            )
            statement = self._apply_filters(statement, filters)
            return [self._to_domain(recipe) for recipe in session.scalars(statement).all()]

    def list_all(
        self,
        owner_user_id: str,
        filters: RecipeListFilters | None = None,
    ) -> list[Recipe]:
        with self.session_factory() as session:
            statement = self._recipe_query().where(
                RecipeModel.owner_user_id == owner_user_id
            ).order_by(
                RecipeModel.created_at.desc(),
                RecipeModel.id.desc(),
            )
            statement = self._apply_filters(statement, filters)
            return [self._to_domain(recipe) for recipe in session.scalars(statement).all()]

    def get_by_id(self, recipe_id: str, owner_user_id: str) -> Recipe | None:
        with self.session_factory() as session:
            statement = self._recipe_query().where(
                RecipeModel.id == recipe_id,
                RecipeModel.owner_user_id == owner_user_id,
            )
            recipe = session.scalar(statement)
            return self._to_domain(recipe) if recipe is not None else None

    def create(self, recipe: Recipe) -> Recipe:
        with self.session_factory.begin() as session:
            recipe_model = RecipeModel(
                id=recipe.id,
                title=recipe.title,
                description=recipe.description,
                servings=recipe.servings,
                prep_time_minutes=recipe.prep_time_minutes,
                cook_time_minutes=recipe.cook_time_minutes,
                created_at=self._parse_timestamp(recipe.created_at),
                updated_at=self._parse_timestamp(recipe.updated_at),
                owner_user_id=recipe.owner_user_id,
                category=self._get_category(session, recipe.category),
                difficulty=self._get_difficulty(session, recipe.difficulty),
                ingredient_lines=[
                    RecipeIngredientLineModel(
                        line_text=line_text,
                        display_order=index,
                    )
                    for index, line_text in enumerate(recipe.ingredients, start=1)
                ],
                instruction_steps=[
                    RecipeInstructionStepModel(
                        step_text=step_text,
                        step_number=index,
                    )
                    for index, step_text in enumerate(recipe.instructions, start=1)
                ],
            )
            session.add(recipe_model)
            session.flush()
            return self._to_domain(recipe_model)

    def update(self, recipe: Recipe) -> Recipe | None:
        with self.session_factory.begin() as session:
            statement = self._recipe_query().where(
                RecipeModel.id == recipe.id,
                RecipeModel.owner_user_id == recipe.owner_user_id,
            )
            recipe_model = session.scalar(statement)

            if recipe_model is None:
                return None

            recipe_model.title = recipe.title
            recipe_model.description = recipe.description
            recipe_model.servings = recipe.servings
            recipe_model.prep_time_minutes = recipe.prep_time_minutes
            recipe_model.cook_time_minutes = recipe.cook_time_minutes
            recipe_model.created_at = self._parse_timestamp(recipe.created_at)
            recipe_model.updated_at = self._parse_timestamp(recipe.updated_at)
            recipe_model.owner_user_id = recipe.owner_user_id
            recipe_model.category = self._get_category(session, recipe.category)
            recipe_model.difficulty = self._get_difficulty(session, recipe.difficulty)
            recipe_model.ingredient_lines.clear()
            recipe_model.instruction_steps.clear()
            session.flush()
            recipe_model.ingredient_lines = [
                RecipeIngredientLineModel(
                    line_text=line_text,
                    display_order=index,
                )
                for index, line_text in enumerate(recipe.ingredients, start=1)
            ]
            recipe_model.instruction_steps = [
                RecipeInstructionStepModel(
                    step_text=step_text,
                    step_number=index,
                )
                for index, step_text in enumerate(recipe.instructions, start=1)
            ]
            session.flush()
            return self._to_domain(recipe_model)

    def delete(self, recipe_id: str, owner_user_id: str) -> bool:
        with self.session_factory.begin() as session:
            statement = select(RecipeModel).where(
                RecipeModel.id == recipe_id,
                RecipeModel.owner_user_id == owner_user_id,
            )
            recipe_model = session.scalar(statement)

            if recipe_model is None:
                return False

            session.delete(recipe_model)
            return True

    @staticmethod
    def _recipe_query() -> Select[tuple[RecipeModel]]:
        return select(RecipeModel).options(
            joinedload(RecipeModel.category),
            joinedload(RecipeModel.difficulty),
            selectinload(RecipeModel.ingredient_lines),
            selectinload(RecipeModel.instruction_steps),
        )

    @staticmethod
    def _apply_filters(
        statement: Select,
        filters: RecipeListFilters | None,
    ) -> Select:
        if filters is None or filters.is_empty:
            return statement

        if filters.category is not None:
            statement = statement.join(RecipeModel.category).where(
                CategoryModel.name == filters.category.value
            )

        if filters.difficulty is not None:
            statement = statement.join(RecipeModel.difficulty).where(
                DifficultyLevelModel.name == filters.difficulty.value
            )

        if filters.search is not None:
            search_value = f"%{filters.search}%"
            statement = statement.where(
                or_(
                    RecipeModel.title.ilike(search_value),
                    RecipeModel.description.ilike(search_value),
                )
            )

        return statement

    @staticmethod
    def _get_category(session: Session, category: RecipeCategory) -> CategoryModel:
        category_model = session.scalar(
            select(CategoryModel).where(CategoryModel.name == category.value)
        )

        if category_model is None:
            raise ValueError(f'Missing category lookup for "{category.value}".')

        return category_model

    @staticmethod
    def _get_difficulty(
        session: Session,
        difficulty: RecipeDifficulty,
    ) -> DifficultyLevelModel:
        difficulty_model = session.scalar(
            select(DifficultyLevelModel).where(
                DifficultyLevelModel.name == difficulty.value
            )
        )

        if difficulty_model is None:
            raise ValueError(f'Missing difficulty lookup for "{difficulty.value}".')

        return difficulty_model

    @classmethod
    def _to_domain(cls, recipe_model: RecipeModel) -> Recipe:
        return Recipe(
            id=recipe_model.id,
            owner_user_id=recipe_model.owner_user_id,
            title=recipe_model.title,
            category=RecipeCategory(recipe_model.category.name),
            difficulty=RecipeDifficulty(recipe_model.difficulty.name),
            servings=recipe_model.servings,
            prep_time_minutes=recipe_model.prep_time_minutes,
            cook_time_minutes=recipe_model.cook_time_minutes,
            total_time_minutes=recipe_model.prep_time_minutes + recipe_model.cook_time_minutes,
            description=recipe_model.description,
            ingredients=[
                ingredient.line_text for ingredient in recipe_model.ingredient_lines
            ],
            instructions=[
                instruction.step_text for instruction in recipe_model.instruction_steps
            ],
            created_at=cls._format_timestamp(recipe_model.created_at),
            updated_at=cls._format_timestamp(recipe_model.updated_at),
        )

    @staticmethod
    def _parse_timestamp(timestamp: str) -> datetime:
        return datetime.fromisoformat(timestamp.replace("Z", "+00:00"))

    @staticmethod
    def _format_timestamp(value: datetime) -> str:
        return (
            value.astimezone(timezone.utc)
            .isoformat(timespec="milliseconds")
            .replace("+00:00", "Z")
        )

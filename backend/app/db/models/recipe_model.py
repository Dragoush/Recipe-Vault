from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class RecipeModel(Base):
    __tablename__ = "recipes"
    __table_args__ = (
        CheckConstraint("char_length(title) BETWEEN 3 AND 60", name="ck_recipes_title_length"),
        CheckConstraint(
            "char_length(description) BETWEEN 12 AND 260",
            name="ck_recipes_description_length",
        ),
        CheckConstraint("servings BETWEEN 1 AND 24", name="ck_recipes_servings_range"),
        CheckConstraint(
            "prep_time_minutes BETWEEN 0 AND 600",
            name="ck_recipes_prep_time_range",
        ),
        CheckConstraint(
            "cook_time_minutes BETWEEN 0 AND 600",
            name="ck_recipes_cook_time_range",
        ),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    servings: Mapped[int] = mapped_column(Integer, nullable=False)
    prep_time_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    cook_time_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    owner_user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id"),
        nullable=False,
    )
    difficulty_id: Mapped[int] = mapped_column(
        ForeignKey("difficulty_levels.id"),
        nullable=False,
    )

    owner = relationship("UserModel", back_populates="recipes")
    category = relationship("CategoryModel", back_populates="recipes")
    difficulty = relationship("DifficultyLevelModel", back_populates="recipes")
    ingredient_lines = relationship(
        "RecipeIngredientLineModel",
        back_populates="recipe",
        cascade="all, delete-orphan",
        order_by="RecipeIngredientLineModel.display_order",
    )
    instruction_steps = relationship(
        "RecipeInstructionStepModel",
        back_populates="recipe",
        cascade="all, delete-orphan",
        order_by="RecipeInstructionStepModel.step_number",
    )

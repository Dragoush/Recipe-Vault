from sqlalchemy import ForeignKey, Integer, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class RecipeIngredientLineModel(Base):
    __tablename__ = "recipe_ingredient_lines"
    __table_args__ = (
        UniqueConstraint(
            "recipe_id",
            "display_order",
            name="uq_recipe_ingredient_lines_recipe_id_display_order",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    recipe_id: Mapped[str] = mapped_column(
        ForeignKey("recipes.id", ondelete="CASCADE"),
        nullable=False,
    )
    line_text: Mapped[str] = mapped_column(Text, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False)

    recipe = relationship("RecipeModel", back_populates="ingredient_lines")

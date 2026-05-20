from sqlalchemy import ForeignKey, Integer, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class RecipeInstructionStepModel(Base):
    __tablename__ = "recipe_instruction_steps"
    __table_args__ = (
        UniqueConstraint(
            "recipe_id",
            "step_number",
            name="uq_recipe_instruction_steps_recipe_id_step_number",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    recipe_id: Mapped[str] = mapped_column(
        ForeignKey("recipes.id", ondelete="CASCADE"),
        nullable=False,
    )
    step_text: Mapped[str] = mapped_column(Text, nullable=False)
    step_number: Mapped[int] = mapped_column(Integer, nullable=False)

    recipe = relationship("RecipeModel", back_populates="instruction_steps")

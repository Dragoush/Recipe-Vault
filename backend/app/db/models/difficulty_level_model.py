from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class DifficultyLevelModel(Base):
    __tablename__ = "difficulty_levels"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(16), unique=True, nullable=False)

    recipes = relationship("RecipeModel", back_populates="difficulty")

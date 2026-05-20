"""create recipe schema

Revision ID: 20260514_0001
Revises:
Create Date: 2026-05-14 20:30:00
"""

from collections.abc import Sequence
from typing import Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260514_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=32), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_table(
        "difficulty_levels",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=16), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_table(
        "recipes",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("title", sa.String(length=60), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("servings", sa.Integer(), nullable=False),
        sa.Column("prep_time_minutes", sa.Integer(), nullable=False),
        sa.Column("cook_time_minutes", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("category_id", sa.Integer(), nullable=False),
        sa.Column("difficulty_id", sa.Integer(), nullable=False),
        sa.CheckConstraint("char_length(title) BETWEEN 3 AND 60", name="ck_recipes_title_length"),
        sa.CheckConstraint(
            "char_length(description) BETWEEN 12 AND 260",
            name="ck_recipes_description_length",
        ),
        sa.CheckConstraint("servings BETWEEN 1 AND 24", name="ck_recipes_servings_range"),
        sa.CheckConstraint(
            "prep_time_minutes BETWEEN 0 AND 600",
            name="ck_recipes_prep_time_range",
        ),
        sa.CheckConstraint(
            "cook_time_minutes BETWEEN 0 AND 600",
            name="ck_recipes_cook_time_range",
        ),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"]),
        sa.ForeignKeyConstraint(["difficulty_id"], ["difficulty_levels.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_recipes_title"), "recipes", ["title"], unique=False)
    op.create_table(
        "recipe_ingredient_lines",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("recipe_id", sa.String(length=64), nullable=False),
        sa.Column("line_text", sa.Text(), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["recipe_id"], ["recipes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "recipe_id",
            "display_order",
            name="uq_recipe_ingredient_lines_recipe_id_display_order",
        ),
    )
    op.create_table(
        "recipe_instruction_steps",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("recipe_id", sa.String(length=64), nullable=False),
        sa.Column("step_text", sa.Text(), nullable=False),
        sa.Column("step_number", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["recipe_id"], ["recipes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "recipe_id",
            "step_number",
            name="uq_recipe_instruction_steps_recipe_id_step_number",
        ),
    )

    categories_table = sa.table(
        "categories",
        sa.column("name", sa.String(length=32)),
    )
    op.bulk_insert(
        categories_table,
        [
            {"name": "Breakfast"},
            {"name": "Lunch"},
            {"name": "Dinner"},
            {"name": "Dessert"},
            {"name": "Snack"},
            {"name": "Drink"},
        ],
    )

    difficulty_levels_table = sa.table(
        "difficulty_levels",
        sa.column("name", sa.String(length=16)),
    )
    op.bulk_insert(
        difficulty_levels_table,
        [
            {"name": "Easy"},
            {"name": "Medium"},
            {"name": "Hard"},
        ],
    )


def downgrade() -> None:
    op.drop_table("recipe_instruction_steps")
    op.drop_table("recipe_ingredient_lines")
    op.drop_index(op.f("ix_recipes_title"), table_name="recipes")
    op.drop_table("recipes")
    op.drop_table("difficulty_levels")
    op.drop_table("categories")

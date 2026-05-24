"""add auth and recipe ownership

Revision ID: 20260524_0002
Revises: 20260514_0001
Create Date: 2026-05-24 18:30:00
"""

from collections.abc import Sequence
from datetime import UTC, datetime
from typing import Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260524_0002"
down_revision: Union[str, None] = "20260514_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

LEGACY_USER_ID = "user-legacy-recipes"
LEGACY_USERNAME = "legacy_recipes"
LEGACY_PASSWORD_HASH = "disabled$legacy_recipes"


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("username", sa.String(length=32), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("role", sa.String(length=16), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "char_length(username) BETWEEN 3 AND 32",
            name="ck_users_username_length",
        ),
        sa.CheckConstraint(
            "role IN ('USER', 'ADMIN')",
            name="ck_users_role_allowed",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_username", "users", ["username"], unique=True)

    op.create_table(
        "auth_sessions",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("user_id", sa.String(length=64), nullable=False),
        sa.Column("refresh_token_hash", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_activity_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
            name="fk_auth_sessions_user_id_users",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_auth_sessions_user_id", "auth_sessions", ["user_id"], unique=False)
    op.create_index(
        "ix_auth_sessions_refresh_token_hash",
        "auth_sessions",
        ["refresh_token_hash"],
        unique=True,
    )

    current_time = datetime.now(UTC)
    users_table = sa.table(
        "users",
        sa.column("id", sa.String(length=64)),
        sa.column("username", sa.String(length=32)),
        sa.column("password_hash", sa.Text()),
        sa.column("role", sa.String(length=16)),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
    )
    op.bulk_insert(
        users_table,
        [
            {
                "id": LEGACY_USER_ID,
                "username": LEGACY_USERNAME,
                "password_hash": LEGACY_PASSWORD_HASH,
                "role": "USER",
                "created_at": current_time,
                "updated_at": current_time,
            }
        ],
    )

    op.add_column(
        "recipes",
        sa.Column("owner_user_id", sa.String(length=64), nullable=True),
    )
    op.execute(
        sa.text(
            "UPDATE recipes SET owner_user_id = :legacy_user_id WHERE owner_user_id IS NULL"
        ).bindparams(legacy_user_id=LEGACY_USER_ID)
    )
    op.alter_column("recipes", "owner_user_id", nullable=False)
    op.create_foreign_key(
        "fk_recipes_owner_user_id_users",
        "recipes",
        "users",
        ["owner_user_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index("ix_recipes_owner_user_id", "recipes", ["owner_user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_recipes_owner_user_id", table_name="recipes")
    op.drop_constraint("fk_recipes_owner_user_id_users", "recipes", type_="foreignkey")
    op.drop_column("recipes", "owner_user_id")

    op.drop_index("ix_auth_sessions_refresh_token_hash", table_name="auth_sessions")
    op.drop_index("ix_auth_sessions_user_id", table_name="auth_sessions")
    op.drop_table("auth_sessions")

    op.drop_index("ix_users_username", table_name="users")
    op.drop_table("users")

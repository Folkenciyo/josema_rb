"""Sessions the client actually trained, set by set

Revision ID: f7d4b2e91c65
Revises: e5a1c8d740b3
Create Date: 2026-08-11

Additive migration: two new tables. Each set copies the exercise name and the
target from the plan, so rewriting the routine never rewrites what was lifted.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision: str = "f7d4b2e91c65"
down_revision: Union[str, Sequence[str], None] = "e5a1c8d740b3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# The type already exists (training_days uses it); `create_type=False` keeps
# `create_table` from trying to create it a second time and failing.
DAY_OF_WEEK = postgresql.ENUM(name="day_of_week", create_type=False)


def upgrade() -> None:
    op.create_table(
        "workout_sessions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "client_id",
            UUID(as_uuid=True),
            sa.ForeignKey("clients.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "training_day_id",
            UUID(as_uuid=True),
            sa.ForeignKey("training_days.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("device_session_id", sa.String(64), nullable=False),
        sa.Column("performed_on", sa.Date(), nullable=False),
        sa.Column("day_of_week", DAY_OF_WEEK, nullable=False),
        sa.Column("plan_title", sa.String(255), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint(
            "client_id", "device_session_id", name="uq_workout_session_device"
        ),
    )
    op.create_index("ix_workout_sessions_client_id", "workout_sessions", ["client_id"])
    op.create_index(
        "ix_workout_sessions_performed_on", "workout_sessions", ["performed_on"]
    )

    op.create_table(
        "workout_sets",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "session_id",
            UUID(as_uuid=True),
            sa.ForeignKey("workout_sessions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "training_day_exercise_id",
            UUID(as_uuid=True),
            sa.ForeignKey("training_day_exercises.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "exercise_id",
            sa.String(255),
            sa.ForeignKey("exercises.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("exercise_name", sa.String(255), nullable=False),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("set_number", sa.Integer(), nullable=False),
        sa.Column("target_reps", sa.String(50), nullable=True),
        sa.Column("weight_kg", sa.Numeric(6, 2), nullable=True),
        sa.Column("reps", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint(
            "session_id", "order_index", "set_number", name="uq_workout_set_position"
        ),
    )
    op.create_index("ix_workout_sets_session_id", "workout_sets", ["session_id"])
    op.create_index("ix_workout_sets_exercise_id", "workout_sets", ["exercise_id"])


def downgrade() -> None:
    op.drop_index("ix_workout_sets_exercise_id", table_name="workout_sets")
    op.drop_index("ix_workout_sets_session_id", table_name="workout_sets")
    op.drop_table("workout_sets")
    op.drop_index("ix_workout_sessions_performed_on", table_name="workout_sessions")
    op.drop_index("ix_workout_sessions_client_id", table_name="workout_sessions")
    op.drop_table("workout_sessions")

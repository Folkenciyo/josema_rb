"""A trainer can customize individual set targets — reps and a modifier

Revision ID: b7d3f2a481e6
Revises: a3f8c1d92b56
Create Date: 2026-09-19

Additive: most exercises have no rows here and keep using the shared
sets/reps on training_day_exercises exactly as before. A row only exists for
a set the trainer expanded individually, e.g. the last one "al fallo" or with
2 reps in reserve.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision: str = "b7d3f2a481e6"
down_revision: Union[str, Sequence[str], None] = "a3f8c1d92b56"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# SQLAlchemy stores the *names* of a StrEnum's members, not their values.
MODIFIERS = ("NORMAL", "TO_FAILURE", "RIR")


def upgrade() -> None:
    set_modifier = postgresql.ENUM(*MODIFIERS, name="set_modifier", create_type=False)
    set_modifier.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "training_day_exercise_sets",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "training_day_exercise_id",
            UUID(as_uuid=True),
            sa.ForeignKey("training_day_exercises.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("set_number", sa.Integer(), nullable=False),
        sa.Column("reps", sa.String(50), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column(
            "modifier",
            set_modifier,
            nullable=False,
            server_default="NORMAL",
        ),
        sa.Column("rir_value", sa.Integer(), nullable=True),
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
            "training_day_exercise_id", "set_number", name="uq_planned_set_position"
        ),
    )
    op.create_index(
        "ix_training_day_exercise_sets_training_day_exercise_id",
        "training_day_exercise_sets",
        ["training_day_exercise_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_training_day_exercise_sets_training_day_exercise_id",
        table_name="training_day_exercise_sets",
    )
    op.drop_table("training_day_exercise_sets")
    postgresql.ENUM(name="set_modifier").drop(op.get_bind(), checkfirst=True)

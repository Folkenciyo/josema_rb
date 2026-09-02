"""An exercise can be prescribed by reps or by time held

Revision ID: d1f5a8b93e64
Revises: f9c2a7e51b30
Create Date: 2026-09-02

A plank or a dead hang is not "8-12 reps" — it is a duration. `measurement`
says which of `reps`/`duration_seconds` the row actually carries; the other
stays null. `reps` drops its NOT NULL for this, since a time-based row has
none.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "d1f5a8b93e64"
down_revision: Union[str, Sequence[str], None] = "f9c2a7e51b30"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# SQLAlchemy stores the *names* of a StrEnum's members, not their values.
MEASUREMENTS = ("REPS", "TIME")


def upgrade() -> None:
    exercise_measurement = postgresql.ENUM(
        *MEASUREMENTS, name="exercise_measurement", create_type=False
    )
    exercise_measurement.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "training_day_exercises",
        sa.Column(
            "measurement",
            exercise_measurement,
            nullable=False,
            server_default="REPS",
        ),
    )
    op.add_column(
        "training_day_exercises",
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
    )
    op.alter_column(
        "training_day_exercises", "reps", existing_type=sa.String(50), nullable=True
    )


def downgrade() -> None:
    op.alter_column(
        "training_day_exercises", "reps", existing_type=sa.String(50), nullable=False
    )
    op.drop_column("training_day_exercises", "duration_seconds")
    op.drop_column("training_day_exercises", "measurement")
    postgresql.ENUM(name="exercise_measurement").drop(op.get_bind(), checkfirst=True)

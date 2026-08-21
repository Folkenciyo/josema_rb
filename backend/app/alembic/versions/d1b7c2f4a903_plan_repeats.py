"""A plan can repeat its weeks in a loop

Revision ID: d1b7c2f4a903
Revises: c4a9e3b18d72
Create Date: 2026-08-21

A routine is often a single week the client repeats all month. Until now the
calendar projected each week once and then stopped, so those plans looked as if
they ended after seven days. The flag says the cycle starts over, up to the
plan's end date, and defaults to false so no existing plan changes shape.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d1b7c2f4a903"
down_revision: Union[str, Sequence[str], None] = "c4a9e3b18d72"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "training_plans",
        sa.Column(
            "repeats",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )


def downgrade() -> None:
    op.drop_column("training_plans", "repeats")

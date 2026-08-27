"""A superset can carry a note of its own

Revision ID: e7b3d1a09c48
Revises: d6f2b8c41a09
Create Date: 2026-08-27

The note belongs to the block, not to either exercise in it: "las dos seguidas,
sin soltar la barra" is an instruction about the pair. It is stored on the first
exercise of the group — the one that opens the block — and read back from there;
the rest of the group keeps it null so there is only ever one copy.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e7b3d1a09c48"
down_revision: Union[str, Sequence[str], None] = "d6f2b8c41a09"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "training_day_exercises",
        sa.Column("superset_note", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("training_day_exercises", "superset_note")

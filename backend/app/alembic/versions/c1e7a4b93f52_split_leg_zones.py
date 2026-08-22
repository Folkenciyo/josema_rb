"""Thigh and calf, one reading per leg

Revision ID: c1e7a4b93f52
Revises: b8f5c1d3a274
Create Date: 2026-08-22

The tape goes round each leg on its own, the same way it already did with the
arms. What was written down as plain "thigh" or "calf" becomes the right side:
it is the one the forms asked for first, and throwing the history away to keep
the column name honest would be a worse trade.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c1e7a4b93f52"
down_revision: Union[str, Sequence[str], None] = "b8f5c1d3a274"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLE = "client_body_measurements"
# (old single-leg column, kept as the right side, added left side)
SPLITS = (
    ("thigh_cm", "thigh_right_cm", "thigh_left_cm"),
    ("calf_cm", "calf_right_cm", "calf_left_cm"),
)


def upgrade() -> None:
    for old, right, left in SPLITS:
        op.alter_column(TABLE, old, new_column_name=right)
        op.add_column(TABLE, sa.Column(left, sa.Numeric(4, 1), nullable=True))


def downgrade() -> None:
    """The left leg is dropped: there is nowhere to put it back."""
    for old, right, left in SPLITS:
        op.drop_column(TABLE, left)
        op.alter_column(TABLE, right, new_column_name=old)

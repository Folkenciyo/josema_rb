"""A meal item can belong to a group of interchangeable alternatives

Revision ID: a3f8c1d92b56
Revises: d1f5a8b93e64
Create Date: 2026-09-19

"Lubina 150g o Salmón 200g": items sharing the same alternative_group are shown
together for comparison, but only the first one (by order_index) counts toward
the meal's totals — the alternative is not eaten in addition to it.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a3f8c1d92b56"
down_revision: Union[str, Sequence[str], None] = "d1f5a8b93e64"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "meal_template_items",
        sa.Column("alternative_group", sa.String(length=64), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("meal_template_items", "alternative_group")

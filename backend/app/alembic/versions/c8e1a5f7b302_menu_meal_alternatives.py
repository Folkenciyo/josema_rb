"""A menu meal slot can belong to a group of alternative full meals

Revision ID: c8e1a5f7b302
Revises: b7d3f2a481e6
Create Date: 2026-09-29

"Cena A" o "Cena B": menu meals sharing the same alternative_group are shown
together as options for the same slot, but only the first one (by
order_index) counts toward the menu's totals — mirrors
MealTemplateItem.alternative_group one level up.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c8e1a5f7b302"
down_revision: Union[str, Sequence[str], None] = "b7d3f2a481e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "menu_meals",
        sa.Column("alternative_group", sa.String(length=64), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("menu_meals", "alternative_group")

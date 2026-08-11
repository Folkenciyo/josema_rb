"""When the client agreed to their progress photos being kept

Revision ID: a8c3f1e07d29
Revises: f7d4b2e91c65
Create Date: 2026-08-11

One nullable column: null means nobody ever asked, which is exactly the state
every existing client is in. Withdrawing sets it back to null.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a8c3f1e07d29"
down_revision: Union[str, Sequence[str], None] = "f7d4b2e91c65"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "clients",
        sa.Column("photo_consent_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("clients", "photo_consent_at")

"""An exercise can be taken out of the search without deleting it

Revision ID: d6f2b8c41a09
Revises: c1e7a4b93f52
Create Date: 2026-08-23

An imported exercise cannot be deleted: the seed would bring it back on the
next run, and it may already be written into a client's routine. Hiding it
takes it out of the search and the picker while the routines that use it stay
exactly as they were.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d6f2b8c41a09"
down_revision: Union[str, Sequence[str], None] = "c1e7a4b93f52"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "exercises",
        sa.Column(
            "is_hidden",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )


def downgrade() -> None:
    op.drop_column("exercises", "is_hidden")

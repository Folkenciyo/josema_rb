"""A day of the routine can carry a note of its own

Revision ID: f9c2a7e51b30
Revises: e7b3d1a09c48
Create Date: 2026-08-29

"Lunes: necesito que hagas concentración de hombro" is an instruction about the
whole day, not about any one exercise in it. It is stored on the day so that it
reaches the PDF, the client's portal and the guided workout the same way the
exercises do.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f9c2a7e51b30"
down_revision: Union[str, Sequence[str], None] = "e7b3d1a09c48"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("training_days", sa.Column("notes", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("training_days", "notes")

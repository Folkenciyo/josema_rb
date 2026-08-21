"""The questionnaire gains an introduction written by the trainer

Revision ID: f3a1c58d7e26
Revises: e2c8d3a5b104
Create Date: 2026-08-21

A questionnaire that opens straight into questions reads like an
interrogation. The trainer can now write a few paragraphs before them —
a welcome, or why these data are being asked for. It belongs to the trainer,
like the questions themselves, and starts empty so nothing changes for anyone
until it is written.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f3a1c58d7e26"
down_revision: Union[str, Sequence[str], None] = "e2c8d3a5b104"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "trainers", sa.Column("questionnaire_intro", sa.Text(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("trainers", "questionnaire_intro")

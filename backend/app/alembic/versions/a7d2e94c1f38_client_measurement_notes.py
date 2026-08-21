"""The client writes their own observations with each weigh-in

Revision ID: a7d2e94c1f38
Revises: f3a1c58d7e26
Create Date: 2026-08-21

Every scale reports something different — body fat, water, muscle mass — so
this is free text rather than a column per number nobody else's machine has.

It is a second column and not the existing `notes` on purpose: that one is the
trainer's private note about the client, and it has never travelled to the
phone. Sharing one field would have put the trainer's remarks in front of the
person they are about.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a7d2e94c1f38"
down_revision: Union[str, Sequence[str], None] = "f3a1c58d7e26"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "client_measurements", sa.Column("client_notes", sa.Text(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("client_measurements", "client_notes")

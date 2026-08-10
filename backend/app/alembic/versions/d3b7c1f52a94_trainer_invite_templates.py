"""Trainer's own wording for the portal invitation

Revision ID: d3b7c1f52a94
Revises: c9f2a4d61e08
Create Date: 2026-08-10

Additive migration: three nullable columns on `trainers`. Null keeps the stock
text, so an existing trainer keeps sending exactly what they sent yesterday.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d3b7c1f52a94"
down_revision: Union[str, Sequence[str], None] = "c9f2a4d61e08"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "trainers", sa.Column("invite_whatsapp_template", sa.Text(), nullable=True)
    )
    op.add_column(
        "trainers", sa.Column("invite_email_subject", sa.String(255), nullable=True)
    )
    op.add_column(
        "trainers", sa.Column("invite_email_template", sa.Text(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("trainers", "invite_email_template")
    op.drop_column("trainers", "invite_email_subject")
    op.drop_column("trainers", "invite_whatsapp_template")

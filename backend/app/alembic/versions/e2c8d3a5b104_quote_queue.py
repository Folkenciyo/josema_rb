"""The motivational library becomes an ordered queue

Revision ID: e2c8d3a5b104
Revises: d1b7c2f4a903
Create Date: 2026-08-21

Until now each client saw a message picked from their own id plus the day, so
no two clients read the same thing and there was no such thing as "the active
one". The trainer asked to choose it, so the library gains an explicit order and
the trainer an anchor: which message was showing on which day. Everything else
is still computed from the date, with no scheduling table and no nightly job.

Existing quotes are numbered by creation date, which is the order the rotation
already walked.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision: str = "e2c8d3a5b104"
down_revision: Union[str, Sequence[str], None] = "d1b7c2f4a903"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "motivational_quotes",
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
    )
    # Keep the order the old rotation used, per trainer.
    op.execute("""
        UPDATE motivational_quotes AS q
        SET position = ordered.row_number - 1
        FROM (
            SELECT
                id,
                ROW_NUMBER() OVER (
                    PARTITION BY trainer_id ORDER BY created_at, id
                ) AS row_number
            FROM motivational_quotes
        ) AS ordered
        WHERE q.id = ordered.id
        """)

    op.add_column(
        "trainers",
        sa.Column(
            "quote_anchor_id",
            UUID(as_uuid=True),
            sa.ForeignKey("motivational_quotes.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.add_column("trainers", sa.Column("quote_anchor_date", sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column("trainers", "quote_anchor_date")
    op.drop_column("trainers", "quote_anchor_id")
    op.drop_column("motivational_quotes", "position")

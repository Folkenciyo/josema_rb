"""Client portal access token

Revision ID: c9f2a4d61e08
Revises: b4e8f1a72c56
Create Date: 2026-08-10

Additive migration: two nullable columns on `clients`. Nothing existing is
touched, so it is safe to run against the production database. Existing clients
start without a token, which simply means their portal link is not issued yet.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c9f2a4d61e08"
down_revision: Union[str, Sequence[str], None] = "b4e8f1a72c56"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("clients", sa.Column("portal_token", sa.String(64), nullable=True))
    op.add_column(
        "clients",
        sa.Column("portal_token_issued_at", sa.DateTime(timezone=True), nullable=True),
    )
    # Unique so a token can never resolve to two clients, and indexed because
    # every single portal request looks a client up by it.
    op.create_index("ix_clients_portal_token", "clients", ["portal_token"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_clients_portal_token", table_name="clients")
    op.drop_column("clients", "portal_token_issued_at")
    op.drop_column("clients", "portal_token")

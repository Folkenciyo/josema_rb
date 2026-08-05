"""Client weight measurements

Revision ID: a1c7d5e94b20
Revises: 7f3c9a2b1d84
Create Date: 2026-08-05

Additive migration: a new table only. Nothing existing is touched, so it is safe
to run against the production database. The BMI is not stored — it is derived
from the client height at read time, so fixing a wrong height fixes the history.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision: str = "a1c7d5e94b20"
down_revision: Union[str, Sequence[str], None] = "7f3c9a2b1d84"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "client_measurements",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "client_id",
            UUID(as_uuid=True),
            sa.ForeignKey("clients.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("measured_on", sa.Date(), nullable=False),
        sa.Column("weight_kg", sa.Numeric(5, 2), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint(
            "client_id", "measured_on", name="uq_measurement_client_day"
        ),
    )
    op.create_index(
        "ix_client_measurements_client_id", "client_measurements", ["client_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_client_measurements_client_id", table_name="client_measurements")
    op.drop_table("client_measurements")

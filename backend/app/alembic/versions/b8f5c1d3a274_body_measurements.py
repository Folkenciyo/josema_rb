"""Tape readings by body zone, apart from the weigh-in

Revision ID: b8f5c1d3a274
Revises: a7d2e94c1f38
Create Date: 2026-09-05

A table of its own rather than nine columns on `client_measurements`: the
weight is NOT NULL there, so sharing the row would force someone onto the
scale before they could write down their waist.

Nine fixed zones, all nullable — nobody gets the tape round every spot every
time — and one row per client and day, like the weigh-ins.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision: str = "b8f5c1d3a274"
down_revision: Union[str, Sequence[str], None] = "a7d2e94c1f38"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

ZONES = (
    "neck_cm",
    "chest_cm",
    "arm_right_cm",
    "arm_left_cm",
    "forearm_cm",
    "waist_cm",
    "hip_cm",
    "thigh_cm",
    "calf_cm",
)


def upgrade() -> None:
    op.create_table(
        "client_body_measurements",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "client_id",
            UUID(as_uuid=True),
            sa.ForeignKey("clients.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("measured_on", sa.Date(), nullable=False),
        *(sa.Column(zone, sa.Numeric(4, 1), nullable=True) for zone in ZONES),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("client_notes", sa.Text(), nullable=True),
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
            "client_id", "measured_on", name="uq_body_measurement_client_day"
        ),
    )
    op.create_index(
        "ix_client_body_measurements_client_id",
        "client_body_measurements",
        ["client_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_client_body_measurements_client_id", table_name="client_body_measurements"
    )
    op.drop_table("client_body_measurements")

"""Client progress photos

Revision ID: b4e8f1a72c56
Revises: a1c7d5e94b20
Create Date: 2026-08-05

Additive migration: a new enum and a new table. Only the file paths live in the
database; the images themselves are written to the client_photos volume.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision: str = "b4e8f1a72c56"
down_revision: Union[str, Sequence[str], None] = "a1c7d5e94b20"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# SQLAlchemy stores enum *names*, like the plan_status and day_of_week types
# already in this schema.
POSES = ("FRONT", "SIDE", "BACK")


def upgrade() -> None:
    # create_type=False: the type is created once here, and create_table below
    # must reference it without trying to create it a second time.
    photo_pose = postgresql.ENUM(*POSES, name="photo_pose", create_type=False)
    photo_pose.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "client_photos",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "client_id",
            UUID(as_uuid=True),
            sa.ForeignKey("clients.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("taken_on", sa.Date(), nullable=False),
        sa.Column("pose", photo_pose, nullable=False),
        sa.Column("file_path", sa.String(255), nullable=False),
        sa.Column("thumb_path", sa.String(255), nullable=False),
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
            "client_id", "taken_on", "pose", name="uq_photo_client_day_pose"
        ),
    )
    op.create_index("ix_client_photos_client_id", "client_photos", ["client_id"])


def downgrade() -> None:
    op.drop_index("ix_client_photos_client_id", table_name="client_photos")
    op.drop_table("client_photos")
    postgresql.ENUM(name="photo_pose").drop(op.get_bind(), checkfirst=True)

"""A library of motivational messages, shown on the client portal

Revision ID: c4a9e3b18d72
Revises: b2e6d94a1f37
Create Date: 2026-08-14

A quote carries at most one medium. Images live on disk like the exercise
photos do; YouTube and Instagram are stored as a bare identifier, so nothing a
trainer pastes can reach a client's phone as markup.

`clients.pinned_quote_id` is what lets the trainer override the daily rotation
for one person; ON DELETE SET NULL means removing a quote from the library
quietly returns those clients to the rotation.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision: str = "c4a9e3b18d72"
down_revision: Union[str, Sequence[str], None] = "b2e6d94a1f37"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# SQLAlchemy stores the *names* of a StrEnum's members, not their values.
MEDIA_KINDS = ("NONE", "IMAGE", "YOUTUBE", "INSTAGRAM")


def upgrade() -> None:
    quote_media = postgresql.ENUM(*MEDIA_KINDS, name="quote_media", create_type=False)
    quote_media.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "motivational_quotes",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "trainer_id",
            UUID(as_uuid=True),
            sa.ForeignKey("trainers.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("author", sa.String(120)),
        sa.Column("media_kind", quote_media, nullable=False),
        sa.Column("image_path", sa.String(255)),
        sa.Column("media_ref", sa.String(100)),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )

    op.add_column(
        "clients",
        sa.Column("pinned_quote_id", UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_clients_pinned_quote",
        "clients",
        "motivational_quotes",
        ["pinned_quote_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_clients_pinned_quote", "clients", type_="foreignkey")
    op.drop_column("clients", "pinned_quote_id")
    op.drop_table("motivational_quotes")
    postgresql.ENUM(name="quote_media").drop(op.get_bind(), checkfirst=True)

"""Trainer's questionnaire and the clients' answers

Revision ID: e5a1c8d740b3
Revises: d3b7c1f52a94
Create Date: 2026-08-10

Additive migration: two new tables. The answers keep the question wording copied
in, so rewriting or deleting a question never rewrites what a client answered.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import JSONB, UUID

# revision identifiers, used by Alembic.
revision: str = "e5a1c8d740b3"
down_revision: Union[str, Sequence[str], None] = "d3b7c1f52a94"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# SQLAlchemy stores Python enums by member NAME, and the types already in this
# database (plan_status, photo_pose) follow that same shape. The API still speaks
# the lowercase values, which is what the StrEnum serialises to.
QUESTION_KIND_VALUES = ("SHORT_TEXT", "LONG_TEXT", "NUMBER", "YES_NO", "CHOICE")

# `create_type=False` so `create_table` does not try to create the type a second
# time: the type is created (once, idempotently) at the top of `upgrade`.
QUESTION_KIND = postgresql.ENUM(
    *QUESTION_KIND_VALUES, name="question_kind", create_type=False
)


def upgrade() -> None:
    postgresql.ENUM(*QUESTION_KIND_VALUES, name="question_kind").create(
        op.get_bind(), checkfirst=True
    )

    op.create_table(
        "questionnaire_questions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "trainer_id",
            UUID(as_uuid=True),
            sa.ForeignKey("trainers.id"),
            nullable=False,
        ),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("help_text", sa.Text(), nullable=True),
        sa.Column("kind", QUESTION_KIND, nullable=False),
        sa.Column("options", JSONB(), nullable=True),
        sa.Column("required", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("order_index", sa.Integer(), nullable=False),
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
    )

    op.create_table(
        "client_answers",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "client_id",
            UUID(as_uuid=True),
            sa.ForeignKey("clients.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "question_id",
            UUID(as_uuid=True),
            sa.ForeignKey("questionnaire_questions.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("question_text", sa.Text(), nullable=False),
        sa.Column("answer", sa.Text(), nullable=True),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("answered_at", sa.DateTime(timezone=True), nullable=True),
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
    )
    op.create_index("ix_client_answers_client_id", "client_answers", ["client_id"])


def downgrade() -> None:
    op.drop_index("ix_client_answers_client_id", table_name="client_answers")
    op.drop_table("client_answers")
    op.drop_table("questionnaire_questions")
    postgresql.ENUM(name="question_kind").drop(op.get_bind(), checkfirst=True)

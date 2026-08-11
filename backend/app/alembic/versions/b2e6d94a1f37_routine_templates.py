"""A training plan with no client is a reusable template

Revision ID: b2e6d94a1f37
Revises: a8c3f1e07d29
Create Date: 2026-08-11

Templates reuse the plan tables instead of duplicating the whole
plan/week/day/exercise tree: same editor, same export, same copying code. What
tells them apart is the owner, and the check constraint makes sure there is
exactly one.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision: str = "b2e6d94a1f37"
down_revision: Union[str, Sequence[str], None] = "a8c3f1e07d29"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("training_plans", "client_id", nullable=True)
    op.add_column(
        "training_plans",
        sa.Column(
            "trainer_id",
            UUID(as_uuid=True),
            sa.ForeignKey("trainers.id"),
            nullable=True,
        ),
    )
    op.create_index("ix_training_plans_trainer_id", "training_plans", ["trainer_id"])
    op.create_check_constraint(
        "ck_training_plan_owner",
        "training_plans",
        "(client_id IS NULL) <> (trainer_id IS NULL)",
    )


def downgrade() -> None:
    op.drop_constraint("ck_training_plan_owner", "training_plans", type_="check")
    # Templates have no client to go back to, so they cannot survive the rollback.
    op.execute("DELETE FROM training_plans WHERE client_id IS NULL")
    op.drop_index("ix_training_plans_trainer_id", table_name="training_plans")
    op.drop_column("training_plans", "trainer_id")
    op.alter_column("training_plans", "client_id", nullable=False)

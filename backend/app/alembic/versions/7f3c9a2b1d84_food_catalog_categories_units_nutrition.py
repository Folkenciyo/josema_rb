"""Food catalog: categories, split units and full label nutrition

Revision ID: 7f3c9a2b1d84
Revises: 48138cef2ae6
Create Date: 2026-08-04

Additive migration. Existing foods keep their data: `unit_label` ("100 g") is
parsed into `unit_amount` + `unit_type`, the new nutrition fields default to 0
and the category falls back to "Otros" so the trainer can classify later.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "7f3c9a2b1d84"
down_revision: Union[str, Sequence[str], None] = "48138cef2ae6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

UNCLASSIFIED = "Otros"

# Leading number (accepting a comma as decimal separator) and whatever follows
# it as the unit name.
AMOUNT_PATTERN = r"^\s*([0-9]+(?:[.,][0-9]+)?)"
UNIT_PATTERN = r"^\s*[0-9]+(?:[.,][0-9]+)?\s*(.*)$"

NEW_FOOD_NUTRIENTS = (
    ("sugars_g", sa.Numeric(6, 1)),
    ("saturated_fat_g", sa.Numeric(6, 1)),
    ("fiber_g", sa.Numeric(6, 1)),
    ("salt_g", sa.Numeric(6, 2)),
)

NEW_ITEM_NUTRIENTS = (
    ("sugars_g", sa.Numeric(6, 1)),
    ("saturated_fat_g", sa.Numeric(6, 1)),
    ("fiber_g", sa.Numeric(6, 1)),
    ("salt_g", sa.Numeric(6, 2)),
)


def upgrade() -> None:
    op.add_column("foods", sa.Column("category", sa.String(100), nullable=True))
    op.add_column("foods", sa.Column("subcategory", sa.String(100), nullable=True))
    op.add_column("foods", sa.Column("unit_amount", sa.Numeric(8, 2), nullable=True))
    op.add_column("foods", sa.Column("unit_type", sa.String(30), nullable=True))
    op.add_column("foods", sa.Column("slug", sa.String(150), nullable=True))
    op.add_column("foods", sa.Column("source", sa.String(20), nullable=True))
    for column_name, column_type in NEW_FOOD_NUTRIENTS:
        op.add_column("foods", sa.Column(column_name, column_type, nullable=True))

    op.execute(
        sa.text(
            f"""
            UPDATE foods SET
                category = :unclassified,
                source = 'custom',
                unit_amount = COALESCE(
                    NULLIF(
                        replace(
                            substring(unit_label from '{AMOUNT_PATTERN}'), ',', '.'
                        ),
                        ''
                    )::numeric,
                    1
                ),
                unit_type = COALESCE(
                    NULLIF(trim(substring(unit_label from '{UNIT_PATTERN}')), ''),
                    NULLIF(trim(unit_label), ''),
                    'unidad'
                ),
                sugars_g = 0,
                saturated_fat_g = 0,
                fiber_g = 0,
                salt_g = 0
            """
        ).bindparams(unclassified=UNCLASSIFIED)
    )

    op.alter_column("foods", "category", nullable=False)
    op.alter_column("foods", "unit_amount", nullable=False)
    op.alter_column("foods", "unit_type", nullable=False)
    op.alter_column("foods", "source", nullable=False)
    for column_name, _ in NEW_FOOD_NUTRIENTS:
        op.alter_column("foods", column_name, nullable=False)

    op.create_unique_constraint("uq_foods_slug", "foods", ["slug"])
    op.create_index("ix_foods_category", "foods", ["category"])
    op.drop_column("foods", "unit_label")

    op.add_column(
        "meal_template_items",
        sa.Column("quantity_amount", sa.Numeric(8, 2), nullable=True),
    )
    op.add_column(
        "meal_template_items", sa.Column("quantity_unit", sa.String(30), nullable=True)
    )
    for column_name, column_type in NEW_ITEM_NUTRIENTS:
        op.add_column(
            "meal_template_items", sa.Column(column_name, column_type, nullable=True)
        )

    # Rebuild the real amount of existing catalog lines from the multiplier that
    # was stored against the food's reference quantity.
    op.execute(
        sa.text(
            """
            UPDATE meal_template_items AS item SET
                quantity_amount = food.unit_amount * item.quantity_multiplier,
                quantity_unit = food.unit_type
            FROM foods AS food
            WHERE item.food_id = food.id
              AND item.quantity_multiplier IS NOT NULL
            """
        )
    )


def downgrade() -> None:
    for column_name, _ in NEW_ITEM_NUTRIENTS:
        op.drop_column("meal_template_items", column_name)
    op.drop_column("meal_template_items", "quantity_unit")
    op.drop_column("meal_template_items", "quantity_amount")

    op.add_column("foods", sa.Column("unit_label", sa.String(50), nullable=True))
    op.execute(
        sa.text(
            """
            UPDATE foods SET unit_label = concat(
                trim(trailing '.' from trim(trailing '0' from unit_amount::text)),
                ' ',
                unit_type
            )
            """
        )
    )
    op.alter_column("foods", "unit_label", nullable=False)

    op.drop_index("ix_foods_category", table_name="foods")
    op.drop_constraint("uq_foods_slug", "foods", type_="unique")
    for column_name, _ in NEW_FOOD_NUTRIENTS:
        op.drop_column("foods", column_name)
    op.drop_column("foods", "source")
    op.drop_column("foods", "slug")
    op.drop_column("foods", "unit_type")
    op.drop_column("foods", "unit_amount")
    op.drop_column("foods", "subcategory")
    op.drop_column("foods", "category")

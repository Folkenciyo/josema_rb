import uuid

from sqlalchemy import ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class MealTemplate(Base, TimestampMixin):
    """Reusable single meal (e.g. "Desayuno proteico"), owned by the trainer."""

    __tablename__ = "meal_templates"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    trainer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("trainers.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)

    items: Mapped[list["MealTemplateItem"]] = relationship(
        back_populates="meal_template",
        cascade="all, delete-orphan",
        order_by="MealTemplateItem.order_index",
    )


class MealTemplateItem(Base, TimestampMixin):
    __tablename__ = "meal_template_items"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    meal_template_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("meal_templates.id"), nullable=False
    )
    # Optional pointer to the reusable Food this item was sourced from, used to
    # auto-compute macros at write time. The macro fields below are always a
    # self-contained snapshot so historical meals don't change if the Food is
    # edited or removed later.
    food_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("foods.id", ondelete="SET NULL")
    )
    food_name: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity_label: Mapped[str | None] = mapped_column(String(50))
    # Real amount served (150) and its unit ("g"), kept so the line can be
    # re-edited and printed as written. quantity_multiplier stays as the factor
    # actually applied to the Food macros (150 / 100 = 1.5).
    quantity_amount: Mapped[float | None] = mapped_column(Numeric(8, 2))
    quantity_unit: Mapped[str | None] = mapped_column(String(30))
    quantity_multiplier: Mapped[float | None] = mapped_column(Numeric(6, 2))
    calories: Mapped[float | None] = mapped_column(Numeric(6, 1))
    protein_g: Mapped[float | None] = mapped_column(Numeric(6, 1))
    carbs_g: Mapped[float | None] = mapped_column(Numeric(6, 1))
    sugars_g: Mapped[float | None] = mapped_column(Numeric(6, 1))
    fat_g: Mapped[float | None] = mapped_column(Numeric(6, 1))
    saturated_fat_g: Mapped[float | None] = mapped_column(Numeric(6, 1))
    fiber_g: Mapped[float | None] = mapped_column(Numeric(6, 1))
    salt_g: Mapped[float | None] = mapped_column(Numeric(6, 2))
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)

    meal_template: Mapped["MealTemplate"] = relationship(back_populates="items")

import uuid
from datetime import time
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String, Text, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.meal_template import MealTemplate


class Menu(Base, TimestampMixin):
    """Reusable full-day eating plan, owned by the trainer.

    Composed of an ordered list of MealTemplate references (MenuMeal), so the
    same meal template can appear in many menus and the same menu can be
    assigned to many DietDay rows across different plans/clients.
    """

    __tablename__ = "menus"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    trainer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("trainers.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)

    meals: Mapped[list["MenuMeal"]] = relationship(
        back_populates="menu",
        cascade="all, delete-orphan",
        order_by="MenuMeal.order_index",
    )


class MenuMeal(Base, TimestampMixin):
    __tablename__ = "menu_meals"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    menu_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("menus.id"), nullable=False
    )
    meal_template_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("meal_templates.id"), nullable=False
    )
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    time_of_day: Mapped[time | None] = mapped_column(Time)

    menu: Mapped["Menu"] = relationship(back_populates="meals")
    meal_template: Mapped["MealTemplate"] = relationship()

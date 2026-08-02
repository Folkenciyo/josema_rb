import uuid
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Date, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin
from app.models.training_plan import DayOfWeek, PlanStatus

if TYPE_CHECKING:
    from app.models.client import Client
    from app.models.menu import Menu


class DietPlan(Base, TimestampMixin):
    __tablename__ = "diet_plans"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[PlanStatus] = mapped_column(
        Enum(PlanStatus, name="plan_status"), default=PlanStatus.DRAFT
    )
    daily_calories_target: Mapped[float | None] = mapped_column(Numeric(6, 1))
    daily_protein_g: Mapped[float | None] = mapped_column(Numeric(6, 1))
    daily_carbs_g: Mapped[float | None] = mapped_column(Numeric(6, 1))
    daily_fat_g: Mapped[float | None] = mapped_column(Numeric(6, 1))

    client: Mapped["Client"] = relationship(back_populates="diet_plans")
    weeks: Mapped[list["DietWeek"]] = relationship(
        back_populates="diet_plan",
        cascade="all, delete-orphan",
        order_by="DietWeek.week_number",
    )


class DietWeek(Base, TimestampMixin):
    __tablename__ = "diet_weeks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    diet_plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("diet_plans.id"), nullable=False
    )
    week_number: Mapped[int] = mapped_column(Integer, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)

    diet_plan: Mapped["DietPlan"] = relationship(back_populates="weeks")
    days: Mapped[list["DietDay"]] = relationship(
        back_populates="diet_week",
        cascade="all, delete-orphan",
        order_by="DietDay.order_index",
    )


class DietDay(Base, TimestampMixin):
    __tablename__ = "diet_days"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    diet_week_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("diet_weeks.id"), nullable=False
    )
    day_of_week: Mapped[DayOfWeek] = mapped_column(
        Enum(DayOfWeek, name="day_of_week"), nullable=False
    )
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    # Which reusable Menu (if any) this day of the week is eating. Nullable so
    # a day can be left unassigned (e.g. a free/rest day).
    menu_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("menus.id", ondelete="SET NULL")
    )

    diet_week: Mapped["DietWeek"] = relationship(back_populates="days")
    menu: Mapped["Menu | None"] = relationship()

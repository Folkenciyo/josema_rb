import uuid
from datetime import date
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import Date, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.client import Client
    from app.models.exercise import Exercise


class PlanStatus(StrEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"


class DayOfWeek(StrEnum):
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"


class TrainingPlan(Base, TimestampMixin):
    __tablename__ = "training_plans"

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

    client: Mapped["Client"] = relationship(back_populates="training_plans")
    weeks: Mapped[list["TrainingWeek"]] = relationship(
        back_populates="training_plan",
        cascade="all, delete-orphan",
        order_by="TrainingWeek.week_number",
    )


class TrainingWeek(Base, TimestampMixin):
    __tablename__ = "training_weeks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    training_plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("training_plans.id"), nullable=False
    )
    week_number: Mapped[int] = mapped_column(Integer, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)

    training_plan: Mapped["TrainingPlan"] = relationship(back_populates="weeks")
    days: Mapped[list["TrainingDay"]] = relationship(
        back_populates="training_week",
        cascade="all, delete-orphan",
        order_by="TrainingDay.order_index",
    )


class TrainingDay(Base, TimestampMixin):
    __tablename__ = "training_days"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    training_week_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("training_weeks.id"), nullable=False
    )
    day_of_week: Mapped[DayOfWeek] = mapped_column(
        Enum(DayOfWeek, name="day_of_week"), nullable=False
    )
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)

    training_week: Mapped["TrainingWeek"] = relationship(back_populates="days")
    exercises: Mapped[list["TrainingDayExercise"]] = relationship(
        back_populates="training_day",
        cascade="all, delete-orphan",
        order_by="TrainingDayExercise.order_index",
    )


class TrainingDayExercise(Base, TimestampMixin):
    __tablename__ = "training_day_exercises"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    training_day_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("training_days.id"), nullable=False
    )
    exercise_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("exercises.id"), nullable=False
    )
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    sets: Mapped[int] = mapped_column(Integer, nullable=False)
    reps: Mapped[str] = mapped_column(String(50), nullable=False)
    rest_seconds: Mapped[int | None] = mapped_column(Integer)
    tempo: Mapped[str | None] = mapped_column(String(50))
    superset_group: Mapped[int | None] = mapped_column(Integer)
    notes: Mapped[str | None] = mapped_column(Text)

    training_day: Mapped["TrainingDay"] = relationship(back_populates="exercises")
    exercise: Mapped["Exercise"] = relationship()

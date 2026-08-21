import uuid
from datetime import date
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    false,
)
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
    """A client's routine — or, with no client, a reusable template.

    A template is the same thing as a plan on purpose: it is edited with the
    same weeks-and-days editor, exported by the same code and copied onto a
    client by the same routine. The only difference is who owns it.
    """

    __tablename__ = "training_plans"
    __table_args__ = (
        CheckConstraint(
            "(client_id IS NULL) <> (trainer_id IS NULL)",
            name="ck_training_plan_owner",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.id"), index=True
    )
    # Set only on templates, which belong to the trainer and to no client.
    trainer_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("trainers.id"), index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    # Whether the weeks start over once the last one is done — the usual shape
    # of a routine that is one week repeated all month. Only the calendar reads
    # it: the plan itself is still written once.
    repeats: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=false()
    )
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

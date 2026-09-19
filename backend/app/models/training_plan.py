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
    UniqueConstraint,
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


class ExerciseMeasurement(StrEnum):
    REPS = "reps"
    TIME = "time"


class SetModifier(StrEnum):
    NORMAL = "normal"
    TO_FAILURE = "to_failure"
    RIR = "rir"


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
    # What the trainer wants done that day beyond the list of exercises —
    # "hoy céntrate en la concentración de hombro". It belongs to the day, so it
    # travels with the routine into the PDF, the portal and the guided workout.
    notes: Mapped[str | None] = mapped_column(Text)

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
    measurement: Mapped[ExerciseMeasurement] = mapped_column(
        Enum(ExerciseMeasurement, name="exercise_measurement"),
        nullable=False,
        default=ExerciseMeasurement.REPS,
        server_default=ExerciseMeasurement.REPS.name,
    )
    # Exactly one of the two is set, matching `measurement` — enforced in the
    # Pydantic schema rather than a DB constraint, since it is edited as a pair.
    reps: Mapped[str | None] = mapped_column(String(50))
    duration_seconds: Mapped[int | None] = mapped_column(Integer)
    rest_seconds: Mapped[int | None] = mapped_column(Integer)
    tempo: Mapped[str | None] = mapped_column(String(50))
    superset_group: Mapped[int | None] = mapped_column(Integer)
    notes: Mapped[str | None] = mapped_column(Text)
    # A note about the whole block — "las dos seguidas, sin soltar la barra" —
    # rather than about this exercise. Only the first row of a superset group
    # carries it; every other row keeps it null so there is one copy of it.
    superset_note: Mapped[str | None] = mapped_column(Text)

    training_day: Mapped["TrainingDay"] = relationship(back_populates="exercises")
    exercise: Mapped["Exercise"] = relationship()
    # Empty unless the trainer customized individual sets — e.g. the last one
    # "al fallo". When empty, `sets`/`reps` above are the shared target for
    # every set, exactly as before this existed.
    planned_sets: Mapped[list["TrainingDayExerciseSet"]] = relationship(
        back_populates="training_day_exercise",
        cascade="all, delete-orphan",
        order_by="TrainingDayExerciseSet.set_number",
    )


class TrainingDayExerciseSet(Base, TimestampMixin):
    """One customized set's target, when it differs from the exercise's shared one.

    Only exists for exercises the trainer expanded via "Personalizar series" —
    most exercises have none, and fall back to `sets` × `reps` on the parent row.
    """

    __tablename__ = "training_day_exercise_sets"
    __table_args__ = (
        UniqueConstraint(
            "training_day_exercise_id", "set_number", name="uq_planned_set_position"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    training_day_exercise_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("training_day_exercises.id", ondelete="CASCADE"),
        nullable=False,
    )
    set_number: Mapped[int] = mapped_column(Integer, nullable=False)
    reps: Mapped[str | None] = mapped_column(String(50))
    duration_seconds: Mapped[int | None] = mapped_column(Integer)
    modifier: Mapped[SetModifier] = mapped_column(
        Enum(SetModifier, name="set_modifier"),
        nullable=False,
        default=SetModifier.NORMAL,
        server_default=SetModifier.NORMAL.name,
    )
    # Only set when modifier is RIR — reps left "in the tank" on that set.
    rir_value: Mapped[int | None] = mapped_column(Integer)

    training_day_exercise: Mapped["TrainingDayExercise"] = relationship(
        back_populates="planned_sets"
    )

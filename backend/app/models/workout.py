import uuid
from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Date,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin
from app.models.training_plan import DayOfWeek

if TYPE_CHECKING:
    from app.models.client import Client


class WorkoutSession(Base, TimestampMixin):
    """One training session the client actually did.

    The date comes from the phone, not from the server: sessions are recorded in
    gyms with no coverage and may only reach us hours later.
    """

    __tablename__ = "workout_sessions"
    __table_args__ = (
        # The phone keeps sending the same session until it is acknowledged, so
        # its own id is what stops a retry from becoming a second session.
        UniqueConstraint(
            "client_id", "device_session_id", name="uq_workout_session_device"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Kept only to link back to the plan; a session outlives the day it came from.
    training_day_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("training_days.id", ondelete="SET NULL")
    )
    device_session_id: Mapped[str] = mapped_column(String(64), nullable=False)
    performed_on: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    day_of_week: Mapped[DayOfWeek] = mapped_column(
        Enum(DayOfWeek, name="day_of_week"), nullable=False
    )
    plan_title: Mapped[str | None] = mapped_column(String(255))
    notes: Mapped[str | None] = mapped_column(Text)

    client: Mapped["Client"] = relationship(back_populates="workout_sessions")
    sets: Mapped[list["WorkoutSet"]] = relationship(
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="(WorkoutSet.order_index, WorkoutSet.set_number)",
    )


class WorkoutSet(Base, TimestampMixin):
    """A single set that was performed. Sets the client skipped are simply absent.

    Every row copies the exercise name and the target from the plan, the same way
    an answer copies its question: rewriting the routine in August must not
    rewrite what was lifted in July.
    """

    __tablename__ = "workout_sets"
    __table_args__ = (
        UniqueConstraint(
            "session_id", "order_index", "set_number", name="uq_workout_set_position"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workout_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    training_day_exercise_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("training_day_exercises.id", ondelete="SET NULL")
    )
    # What the history is grouped by: the same exercise across plans and months.
    exercise_id: Mapped[str | None] = mapped_column(
        String(255), ForeignKey("exercises.id", ondelete="SET NULL"), index=True
    )
    exercise_name: Mapped[str] = mapped_column(String(255), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    set_number: Mapped[int] = mapped_column(Integer, nullable=False)
    target_reps: Mapped[str | None] = mapped_column(String(50))
    # Null is bodyweight — pull-ups are not a zero kilo lift.
    weight_kg: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    reps: Mapped[int | None] = mapped_column(Integer)

    session: Mapped["WorkoutSession"] = relationship(back_populates="sets")

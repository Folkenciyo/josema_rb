import uuid
from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, Numeric, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.client import Client


class ClientMeasurement(Base, TimestampMixin):
    """A weigh-in on a given day.

    The BMI is derived from the client height at read time, never stored.
    """

    __tablename__ = "client_measurements"
    __table_args__ = (
        UniqueConstraint("client_id", "measured_on", name="uq_measurement_client_day"),
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
    measured_on: Mapped[date] = mapped_column(Date, nullable=False)
    weight_kg: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    # The trainer's private note: it has never travelled to the client's phone.
    notes: Mapped[str | None] = mapped_column(Text)
    # What the client wrote themselves — whatever extra their scale reported.
    client_notes: Mapped[str | None] = mapped_column(Text)

    client: Mapped["Client"] = relationship(back_populates="measurements")


# The tape-measure spots, in the order the forms and the documents show them:
# top to bottom, and the right side before the left one.
BODY_ZONES = (
    "neck_cm",
    "chest_cm",
    "arm_right_cm",
    "arm_left_cm",
    "forearm_cm",
    "waist_cm",
    "hip_cm",
    "thigh_right_cm",
    "thigh_left_cm",
    "calf_right_cm",
    "calf_left_cm",
)


def _zone() -> Mapped[Decimal | None]:
    """One tape reading in centimetres, to one decimal. Blank is the normal case:
    nobody measures all eleven spots every time."""
    return mapped_column(Numeric(4, 1))


class ClientBodyMeasurement(Base, TimestampMixin):
    """The tape readings of one day, one row per client and day.

    A table of its own instead of columns on `client_measurements`: the weight
    is NOT NULL there, so sharing the row would force someone to step on the
    scale before they could write down their waist.
    """

    __tablename__ = "client_body_measurements"
    __table_args__ = (
        UniqueConstraint(
            "client_id", "measured_on", name="uq_body_measurement_client_day"
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
    measured_on: Mapped[date] = mapped_column(Date, nullable=False)

    neck_cm: Mapped[Decimal | None] = _zone()
    chest_cm: Mapped[Decimal | None] = _zone()
    arm_right_cm: Mapped[Decimal | None] = _zone()
    arm_left_cm: Mapped[Decimal | None] = _zone()
    forearm_cm: Mapped[Decimal | None] = _zone()
    waist_cm: Mapped[Decimal | None] = _zone()
    hip_cm: Mapped[Decimal | None] = _zone()
    thigh_right_cm: Mapped[Decimal | None] = _zone()
    thigh_left_cm: Mapped[Decimal | None] = _zone()
    calf_right_cm: Mapped[Decimal | None] = _zone()
    calf_left_cm: Mapped[Decimal | None] = _zone()

    # Same split as the weigh-in: `notes` is the trainer's and never travels to
    # the client's phone, `client_notes` is what the client wrote themselves.
    notes: Mapped[str | None] = mapped_column(Text)
    client_notes: Mapped[str | None] = mapped_column(Text)

    client: Mapped["Client"] = relationship(back_populates="body_measurements")

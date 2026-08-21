import uuid
from datetime import date, datetime
from typing import Annotated, Self

from pydantic import BaseModel, Field, model_validator

# A tape reading in centimetres. The ceiling is generous on purpose: it is there
# to catch someone typing their weight into the waist box, not to judge anyone.
Zone = Annotated[float | None, Field(default=None, gt=0, le=300)]


class MeasurementCreate(BaseModel):
    measured_on: date
    weight_kg: float = Field(gt=0, le=500)
    notes: str | None = None


class MeasurementUpdate(BaseModel):
    measured_on: date | None = None
    weight_kg: float | None = Field(default=None, gt=0, le=500)
    notes: str | None = None


class MeasurementOut(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    measured_on: date
    weight_kg: float
    notes: str | None
    # Written by the client from their portal, and read-only here: the trainer
    # has `notes` for their own remarks.
    client_notes: str | None = None
    created_at: datetime
    updated_at: datetime
    # Derived from the client height, so it is null while the height is unknown.
    bmi: float | None = None

    model_config = {"from_attributes": True}


class BodyZones(BaseModel):
    """The nine spots the tape goes round, in the order every screen shows them.

    All optional: measuring the waist without the calf is the normal case, not
    an incomplete entry.
    """

    neck_cm: Zone
    chest_cm: Zone
    arm_right_cm: Zone
    arm_left_cm: Zone
    forearm_cm: Zone
    waist_cm: Zone
    hip_cm: Zone
    thigh_cm: Zone
    calf_cm: Zone

    def filled_zones(self) -> dict[str, float]:
        zones = BodyZones.model_fields
        return {
            name: value
            for name, value in self.model_dump().items()
            if name in zones and value is not None
        }


class BodyMeasurementCreate(BodyZones):
    measured_on: date
    notes: str | None = None

    @model_validator(mode="after")
    def reject_empty_entry(self) -> Self:
        """A row with a date and nine blanks says nothing and would still take up
        the client's one slot for that day."""
        if not self.filled_zones():
            raise ValueError("At least one zone is needed")
        return self


class BodyMeasurementUpdate(BodyZones):
    """Only the fields sent are touched, so a zone left out keeps its value and
    one sent as null is cleared."""

    measured_on: date | None = None
    notes: str | None = None


class BodyMeasurementOut(BodyZones):
    id: uuid.UUID
    client_id: uuid.UUID
    measured_on: date
    notes: str | None
    # Written by the client from their portal, read-only for the trainer.
    client_notes: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

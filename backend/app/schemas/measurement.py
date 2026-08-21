import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field


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

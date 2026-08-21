import uuid
from datetime import date, datetime
from typing import Self

from pydantic import BaseModel, Field, model_validator

from app.models.photo import PhotoPose
from app.schemas.measurement import BodyZones
from app.schemas.quote import QuoteOut


class PortalTokenOut(BaseModel):
    """What the trainer sees after issuing (or revoking) a portal link."""

    client_id: uuid.UUID
    portal_token: str | None
    portal_token_issued_at: datetime | None

    model_config = {"from_attributes": True}


class InviteTemplatesOut(BaseModel):
    """The trainer's wording, already resolved to the stock text where unset."""

    whatsapp_template: str
    email_subject: str
    email_template: str
    # Names the trainer may use between braces, so the UI can list them.
    placeholders: list[str]


class InviteTemplatesUpdate(BaseModel):
    """An empty field restores the stock text for that channel."""

    whatsapp_template: str | None = None
    email_subject: str | None = None
    email_template: str | None = None


class PortalInviteOut(BaseModel):
    """Ready-to-send wording for the portal link, in both channels."""

    url: str
    subject: str
    body: str
    whatsapp_text: str


class PortalWeighInCreate(BaseModel):
    """What the client writes when they weigh themselves. The day is always today.

    The note is free text on purpose: every scale reports something different —
    body fat, water, muscle mass — and pinning down fields for all of them would
    only fit the machine we happened to think of.
    """

    weight_kg: float = Field(gt=0, le=500)
    notes: str | None = Field(default=None, max_length=500)


class PortalWeighInOut(BaseModel):
    """A weigh-in as the client sees it: no client id, no internal fields."""

    id: uuid.UUID
    measured_on: date
    weight_kg: float
    bmi: float | None
    # What the client wrote down themselves — the numbers their scale gave.
    notes: str | None = None


class PortalBodyMeasurementCreate(BodyZones):
    """The tape readings the client sends. The day is always today, like the weight.

    Zones left out keep whatever was written earlier today: the form is filled
    in bits, one spot at a time, with the tape in the other hand.
    """

    notes: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def reject_empty_entry(self) -> Self:
        if not self.filled_zones():
            raise ValueError("At least one zone is needed")
        return self


class PortalBodyMeasurementOut(BodyZones):
    """A day's tape readings as the client sees them: no client id, and none of
    the trainer's private notes."""

    id: uuid.UUID
    measured_on: date
    notes: str | None = None


class PortalPhotoOut(BaseModel):
    """A progress photo as the client sees it: no client id, no path on disk.

    The id is only good for asking for the file through the same token, so it
    tells a leaked link nothing it could use anywhere else.
    """

    id: uuid.UUID
    taken_on: date
    pose: PhotoPose

    model_config = {"from_attributes": True}


class PortalClientOut(BaseModel):
    """What the client sees. Never carries the client id: the token is the key."""

    full_name: str
    goals: str | None
    latest_weight_kg: float | None
    latest_weighed_on: date | None
    # So the portal only offers what there is to open.
    has_training_plan: bool
    has_diet_plan: bool
    weigh_in_count: int
    # Null means consent was never given. The count is what makes "delete my
    # photos" honest: the client sees how many there are before deciding.
    photo_consent_at: datetime | None
    photo_count: int
    # How many sessions the client has logged, so the portal only offers the
    # progression screen once there is something to draw.
    workout_count: int
    # Today's message, pinned or drawn from the rotation. Null when the trainer
    # has not written any yet.
    quote: QuoteOut | None = None

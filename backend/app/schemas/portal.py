import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.photo import PhotoPose
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
    """The only thing a client may write. The day is always today, never chosen."""

    weight_kg: float = Field(gt=0, le=500)


class PortalWeighInOut(BaseModel):
    """A weigh-in as the client sees it: no client id, and no trainer notes."""

    id: uuid.UUID
    measured_on: date
    weight_kg: float
    bmi: float | None


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

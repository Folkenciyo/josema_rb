import uuid
from datetime import date, datetime

from pydantic import BaseModel


class PortalTokenOut(BaseModel):
    """What the trainer sees after issuing (or revoking) a portal link."""

    client_id: uuid.UUID
    portal_token: str | None
    portal_token_issued_at: datetime | None

    model_config = {"from_attributes": True}


class PortalWeighInOut(BaseModel):
    """A weigh-in as the client sees it: no client id, and no trainer notes."""

    id: uuid.UUID
    measured_on: date
    weight_kg: float
    bmi: float | None


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

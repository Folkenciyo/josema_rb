import uuid
from datetime import date, datetime

from pydantic import BaseModel


class PortalTokenOut(BaseModel):
    """What the trainer sees after issuing (or revoking) a portal link."""

    client_id: uuid.UUID
    portal_token: str | None
    portal_token_issued_at: datetime | None

    model_config = {"from_attributes": True}


class PortalClientOut(BaseModel):
    """What the client sees. Never carries the client id: the token is the key."""

    full_name: str
    goals: str | None
    latest_weight_kg: float | None
    latest_weighed_on: date | None

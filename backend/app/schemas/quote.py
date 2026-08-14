import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.quote import QuoteMedia


class QuoteOut(BaseModel):
    """A message as both the trainer and the client see it.

    The embed address is built here rather than in the browser: the templates
    are the only place a third-party URL is ever assembled, so the stored
    identifier cannot turn into a link to somewhere else.
    """

    id: uuid.UUID
    text: str
    author: str | None
    media_kind: QuoteMedia
    image_url: str | None
    embed_url: str | None
    created_at: datetime


class QuotePinOut(BaseModel):
    """Which message a client has pinned, if any."""

    client_id: uuid.UUID
    pinned_quote: QuoteOut | None


class QuotePinUpdate(BaseModel):
    """Null releases the client back to the daily rotation."""

    quote_id: uuid.UUID | None

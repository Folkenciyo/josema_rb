import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.quote import QuoteMedia

# A week ahead is what fits on the screen and as far as anyone plans a
# motivational message.
DEFAULT_QUEUE_DAYS = 7
MAX_QUEUE_DAYS = 30


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
    # Place in the trainer's queue, so the library screen can show the order.
    position: int


class QueueEntryOut(BaseModel):
    """One day of the queue: what everyone will read that morning."""

    date: date
    quote: QuoteOut


class QuoteQueueOut(BaseModel):
    """Today's message and the ones lined up behind it."""

    today: QueueEntryOut | None
    upcoming: list[QueueEntryOut]


class ReorderQuotesRequest(BaseModel):
    """The whole queue in its new order. Ids not listed keep their tail place."""

    quote_ids: list[uuid.UUID] = Field(min_length=1)


class QuotePinOut(BaseModel):
    """Which message a client has pinned, if any."""

    client_id: uuid.UUID
    pinned_quote: QuoteOut | None


class QuotePinUpdate(BaseModel):
    """Null releases the client back to the daily rotation."""

    quote_id: uuid.UUID | None

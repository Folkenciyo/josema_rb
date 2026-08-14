import uuid
from enum import StrEnum

from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class QuoteMedia(StrEnum):
    """What sits next to the words, if anything."""

    NONE = "none"
    IMAGE = "image"
    YOUTUBE = "youtube"
    INSTAGRAM = "instagram"


class MotivationalQuote(Base, TimestampMixin):
    """One message in the trainer's library.

    A quote carries at most one medium. `media_ref` holds a bare identifier —
    a YouTube video id or an Instagram shortcode — never a URL and never an
    embed snippet: the player address is rebuilt from a fixed template when the
    portal renders it.
    """

    __tablename__ = "motivational_quotes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    trainer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("trainers.id"), nullable=False, index=True
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    author: Mapped[str | None] = mapped_column(String(120))

    media_kind: Mapped[QuoteMedia] = mapped_column(
        Enum(QuoteMedia, name="quote_media"),
        nullable=False,
        default=QuoteMedia.NONE,
    )
    # Set for IMAGE: path relative to the quote image directory.
    image_path: Mapped[str | None] = mapped_column(String(255))
    # Set for YOUTUBE and INSTAGRAM.
    media_ref: Mapped[str | None] = mapped_column(String(100))

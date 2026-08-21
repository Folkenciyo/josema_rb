"""The motivational library, and which of its messages a client sees."""

import uuid
from datetime import date, timedelta

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.models import Client, MotivationalQuote, QuoteMedia, Trainer
from app.repositories import quote_repository
from app.schemas.quote import (
    DEFAULT_QUEUE_DAYS,
    QueueEntryOut,
    QuoteOut,
    QuoteQueueOut,
)
from app.services import quote_rotation, quote_storage
from app.services.quote_media import parse_media_url

IMAGE_URL_PREFIX = "/static/quote-images"
# The only two third-party addresses the app ever builds. `-nocookie` keeps
# YouTube from writing advertising cookies onto a client's phone.
YOUTUBE_EMBED = "https://www.youtube-nocookie.com/embed/{ref}"
INSTAGRAM_EMBED = "https://www.instagram.com/reel/{ref}/embed/"

MAX_TEXT_LENGTH = 500


def to_out(quote: MotivationalQuote) -> QuoteOut:
    image_url = None
    embed_url = None

    if quote.media_kind == QuoteMedia.IMAGE and quote.image_path:
        image_url = f"{IMAGE_URL_PREFIX}/{quote.image_path}"
    elif quote.media_kind == QuoteMedia.YOUTUBE and quote.media_ref:
        embed_url = YOUTUBE_EMBED.format(ref=quote.media_ref)
    elif quote.media_kind == QuoteMedia.INSTAGRAM and quote.media_ref:
        embed_url = INSTAGRAM_EMBED.format(ref=quote.media_ref)

    return QuoteOut(
        id=quote.id,
        text=quote.text,
        author=quote.author,
        media_kind=quote.media_kind,
        image_url=image_url,
        embed_url=embed_url,
        created_at=quote.created_at,
        position=quote.position,
    )


def _clean_text(text: str) -> str:
    cleaned = text.strip()
    if not cleaned:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="El mensaje no puede estar vacío",
        )
    if len(cleaned) > MAX_TEXT_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"El mensaje no puede pasar de {MAX_TEXT_LENGTH} caracteres",
        )
    return cleaned


def _clean_author(author: str | None) -> str | None:
    if author is None:
        return None
    cleaned = author.strip()
    return cleaned or None


def list_quotes(db: Session, trainer: Trainer) -> list[QuoteOut]:
    return [
        to_out(quote) for quote in quote_repository.list_for_trainer(db, trainer.id)
    ]


def get_quote(db: Session, quote_id: uuid.UUID) -> MotivationalQuote:
    quote = quote_repository.get(db, quote_id)
    if quote is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Mensaje no encontrado"
        )
    return quote


async def _apply_media(
    quote: MotivationalQuote, image: UploadFile | None, media_url: str | None
) -> None:
    """A quote carries one medium at most, so setting one clears the other."""
    if image is not None and media_url:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Elige una imagen o un enlace, no las dos cosas",
        )

    if image is not None:
        quote_storage.delete_image(quote.image_path)
        quote.image_path = await quote_storage.save_image(quote.id, image)
        quote.media_kind = QuoteMedia.IMAGE
        quote.media_ref = None
    elif media_url:
        kind, reference = parse_media_url(media_url)
        quote_storage.delete_image(quote.image_path)
        quote.image_path = None
        quote.media_kind = kind
        quote.media_ref = reference


async def create_quote(
    db: Session,
    trainer: Trainer,
    *,
    text: str,
    author: str | None,
    media_url: str | None,
    image: UploadFile | None,
) -> QuoteOut:
    quote = MotivationalQuote(
        id=uuid.uuid4(),
        trainer_id=trainer.id,
        text=_clean_text(text),
        author=_clean_author(author),
        media_kind=QuoteMedia.NONE,
        # The end of the queue: a new message never jumps ahead of the ones the
        # trainer already lined up.
        position=quote_repository.next_position(db, trainer.id),
    )
    await _apply_media(quote, image, media_url)
    return to_out(quote_repository.add(db, quote))


async def update_quote(
    db: Session,
    quote_id: uuid.UUID,
    *,
    text: str | None,
    author: str | None,
    media_url: str | None,
    image: UploadFile | None,
    clear_media: bool,
) -> QuoteOut:
    quote = get_quote(db, quote_id)

    if text is not None:
        quote.text = _clean_text(text)
    if author is not None:
        quote.author = _clean_author(author)

    if clear_media:
        quote_storage.delete_image(quote.image_path)
        quote.image_path = None
        quote.media_ref = None
        quote.media_kind = QuoteMedia.NONE
    else:
        await _apply_media(quote, image, media_url)

    return to_out(quote_repository.save(db, quote))


def delete_quote(db: Session, quote_id: uuid.UUID) -> None:
    quote = get_quote(db, quote_id)
    quote_storage.delete_image(quote.image_path)
    # Clients pinned to it fall back to the rotation: the FK is ON DELETE SET NULL.
    quote_repository.delete(db, quote)


def pin_for_client(
    db: Session, client: Client, quote_id: uuid.UUID | None
) -> QuoteOut | None:
    if quote_id is None:
        client.pinned_quote_id = None
        db.commit()
        return None

    quote = get_quote(db, quote_id)
    client.pinned_quote_id = quote.id
    db.commit()
    return to_out(quote)


def _trainer_of(db: Session, trainer_id: uuid.UUID) -> Trainer:
    return db.query(Trainer).filter(Trainer.id == trainer_id).one()


def _quote_of_the_day(
    db: Session, trainer: Trainer, today: date
) -> MotivationalQuote | None:
    quote_ids = quote_repository.list_ids_in_rotation_order(db, trainer.id)
    chosen = quote_rotation.pick_for_day(
        quote_ids,
        today=today,
        anchor_id=trainer.quote_anchor_id,
        anchor_date=trainer.quote_anchor_date,
    )
    return None if chosen is None else quote_repository.get(db, chosen)


def quote_for_client(
    db: Session, client: Client, today: date | None = None
) -> QuoteOut | None:
    """The pinned message if there is one, otherwise the one the queue is on.

    The queue is the same for everybody: two clients opening their portal the
    same morning now read the same message, which is what makes "the active
    one" mean anything on the trainer's screen.
    """
    if client.pinned_quote_id:
        pinned = quote_repository.get(db, client.pinned_quote_id)
        if pinned is not None:
            return to_out(pinned)

    trainer = _trainer_of(db, client.trainer_id)
    quote = _quote_of_the_day(db, trainer, today or date.today())
    return to_out(quote) if quote else None


def build_queue(
    db: Session, trainer: Trainer, *, days: int, today: date | None = None
) -> QuoteQueueOut:
    """Today's message and the next `days`, so the trainer sees what is coming."""
    today = today or date.today()
    quotes = quote_repository.list_for_trainer(db, trainer.id)
    if not quotes:
        return QuoteQueueOut(today=None, upcoming=[])

    quote_ids = [quote.id for quote in quotes]

    def entry(when: date) -> QueueEntryOut:
        index = quote_rotation.index_for_day(
            quote_ids,
            today=when,
            anchor_id=trainer.quote_anchor_id,
            anchor_date=trainer.quote_anchor_date,
        )
        return QueueEntryOut(date=when, quote=to_out(quotes[index]))

    return QuoteQueueOut(
        today=entry(today),
        upcoming=[
            entry(today + timedelta(days=offset)) for offset in range(1, days + 1)
        ],
    )


def show_today(db: Session, trainer: Trainer, quote_id: uuid.UUID) -> QuoteQueueOut:
    """Put this message up now. The queue keeps walking from here tomorrow."""
    quote = get_quote(db, quote_id)
    trainer.quote_anchor_id = quote.id
    trainer.quote_anchor_date = date.today()
    db.commit()
    return build_queue(db, trainer, days=DEFAULT_QUEUE_DAYS)


def show_next(db: Session, trainer: Trainer, quote_id: uuid.UUID) -> QuoteQueueOut:
    """Move this message to right behind the one showing today.

    Reordering rather than storing a second anchor: the queue has one order, and
    "the next one" is simply whatever sits after today's.
    """
    quote = get_quote(db, quote_id)
    quotes = quote_repository.list_for_trainer(db, trainer.id)
    current = _quote_of_the_day(db, trainer, date.today())

    if current is None or current.id == quote.id:
        return build_queue(db, trainer, days=DEFAULT_QUEUE_DAYS)

    remaining = [item for item in quotes if item.id != quote.id]
    at = next(
        index for index, item in enumerate(remaining) if item.id == current.id
    )
    remaining.insert(at + 1, quote)

    # Renumbering moves today's message too, so the anchor is pinned to it again
    # or tomorrow's pick would slide along with the new order.
    quote_repository.renumber(db, remaining)
    trainer.quote_anchor_id = current.id
    trainer.quote_anchor_date = date.today()
    db.commit()

    return build_queue(db, trainer, days=DEFAULT_QUEUE_DAYS)


def reorder(
    db: Session, trainer: Trainer, quote_ids: list[uuid.UUID]
) -> QuoteQueueOut:
    """Write a new order for the whole queue, keeping today's message showing."""
    quotes = quote_repository.list_for_trainer(db, trainer.id)
    by_id = {quote.id: quote for quote in quotes}

    unknown = [str(item) for item in quote_ids if item not in by_id]
    if unknown:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Algún mensaje de la lista ya no existe",
        )

    current = _quote_of_the_day(db, trainer, date.today())
    listed = [by_id[item] for item in dict.fromkeys(quote_ids)]
    # Anything the caller left out keeps its place at the tail, so a stale screen
    # cannot silently drop messages from the queue.
    rest = [quote for quote in quotes if quote.id not in {q.id for q in listed}]

    quote_repository.renumber(db, listed + rest)

    if current is not None:
        trainer.quote_anchor_id = current.id
        trainer.quote_anchor_date = date.today()
        db.commit()

    return build_queue(db, trainer, days=DEFAULT_QUEUE_DAYS)

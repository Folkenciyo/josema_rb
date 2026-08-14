"""The motivational library, and which of its messages a client sees."""

import uuid
from datetime import date

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.models import Client, MotivationalQuote, QuoteMedia, Trainer
from app.repositories import quote_repository
from app.schemas.quote import QuoteOut
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


def quote_for_client(
    db: Session, client: Client, today: date | None = None
) -> QuoteOut | None:
    """The pinned message if there is one, otherwise today's from the rotation."""
    if client.pinned_quote_id:
        pinned = quote_repository.get(db, client.pinned_quote_id)
        if pinned is not None:
            return to_out(pinned)

    quote_ids = quote_repository.list_ids_in_rotation_order(db, client.trainer_id)
    chosen = quote_rotation.pick_for_day(quote_ids, client.id, today or date.today())
    if chosen is None:
        return None

    quote = quote_repository.get(db, chosen)
    return to_out(quote) if quote else None

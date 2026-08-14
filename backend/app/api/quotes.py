import uuid

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import get_current_trainer
from app.models import Trainer
from app.schemas.quote import QuoteOut, QuotePinOut, QuotePinUpdate
from app.services import client_service, quote_service

router = APIRouter(
    prefix="/api/quotes",
    tags=["quotes"],
    dependencies=[Depends(get_current_trainer)],
)


@router.get("", response_model=list[QuoteOut])
def list_quotes(
    db: Session = Depends(get_db), trainer: Trainer = Depends(get_current_trainer)
) -> list[QuoteOut]:
    return quote_service.list_quotes(db, trainer)


@router.post("", response_model=QuoteOut, status_code=status.HTTP_201_CREATED)
async def create_quote(
    text: str = Form(...),
    author: str | None = Form(None),
    media_url: str | None = Form(None),
    image: UploadFile | None = File(None),
    trainer: Trainer = Depends(get_current_trainer),
    db: Session = Depends(get_db),
) -> QuoteOut:
    return await quote_service.create_quote(
        db, trainer, text=text, author=author, media_url=media_url, image=image
    )


@router.patch("/{quote_id}", response_model=QuoteOut)
async def update_quote(
    quote_id: uuid.UUID,
    text: str | None = Form(None),
    author: str | None = Form(None),
    media_url: str | None = Form(None),
    image: UploadFile | None = File(None),
    clear_media: bool = Form(False),
    db: Session = Depends(get_db),
) -> QuoteOut:
    return await quote_service.update_quote(
        db,
        quote_id,
        text=text,
        author=author,
        media_url=media_url,
        image=image,
        clear_media=clear_media,
    )


@router.delete("/{quote_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quote(quote_id: uuid.UUID, db: Session = Depends(get_db)) -> None:
    quote_service.delete_quote(db, quote_id)


@router.get("/pinned/{client_id}", response_model=QuotePinOut)
def get_pinned(client_id: uuid.UUID, db: Session = Depends(get_db)) -> QuotePinOut:
    client = client_service.get_client(db, client_id)
    pinned = (
        quote_service.to_out(quote_service.get_quote(db, client.pinned_quote_id))
        if client.pinned_quote_id
        else None
    )
    return QuotePinOut(client_id=client.id, pinned_quote=pinned)


@router.put("/pinned/{client_id}", response_model=QuotePinOut)
def set_pinned(
    client_id: uuid.UUID,
    payload: QuotePinUpdate,
    db: Session = Depends(get_db),
) -> QuotePinOut:
    client = client_service.get_client(db, client_id)
    pinned = quote_service.pin_for_client(db, client, payload.quote_id)
    return QuotePinOut(client_id=client.id, pinned_quote=pinned)

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import MotivationalQuote


def list_for_trainer(db: Session, trainer_id: uuid.UUID) -> list[MotivationalQuote]:
    """Newest first for the library screen."""
    return list(
        db.scalars(
            select(MotivationalQuote)
            .where(MotivationalQuote.trainer_id == trainer_id)
            .order_by(MotivationalQuote.created_at.desc())
        )
    )


def list_ids_in_rotation_order(db: Session, trainer_id: uuid.UUID) -> list[uuid.UUID]:
    """Oldest first: a stable order is what keeps the daily pick stable."""
    return list(
        db.scalars(
            select(MotivationalQuote.id)
            .where(MotivationalQuote.trainer_id == trainer_id)
            .order_by(MotivationalQuote.created_at, MotivationalQuote.id)
        )
    )


def get(db: Session, quote_id: uuid.UUID) -> MotivationalQuote | None:
    return db.get(MotivationalQuote, quote_id)


def add(db: Session, quote: MotivationalQuote) -> MotivationalQuote:
    db.add(quote)
    db.commit()
    db.refresh(quote)
    return quote


def save(db: Session, quote: MotivationalQuote) -> MotivationalQuote:
    db.commit()
    db.refresh(quote)
    return quote


def delete(db: Session, quote: MotivationalQuote) -> None:
    db.delete(quote)
    db.commit()

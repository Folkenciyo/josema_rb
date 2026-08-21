import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import MotivationalQuote


def list_for_trainer(db: Session, trainer_id: uuid.UUID) -> list[MotivationalQuote]:
    """In queue order: the library screen is the queue."""
    return list(
        db.scalars(
            select(MotivationalQuote)
            .where(MotivationalQuote.trainer_id == trainer_id)
            .order_by(MotivationalQuote.position, MotivationalQuote.id)
        )
    )


def list_ids_in_rotation_order(db: Session, trainer_id: uuid.UUID) -> list[uuid.UUID]:
    """The queue as ids. A stable order is what keeps the daily pick stable."""
    return list(
        db.scalars(
            select(MotivationalQuote.id)
            .where(MotivationalQuote.trainer_id == trainer_id)
            .order_by(MotivationalQuote.position, MotivationalQuote.id)
        )
    )


def next_position(db: Session, trainer_id: uuid.UUID) -> int:
    """A new message joins the end of the queue."""
    highest = db.scalar(
        select(func.max(MotivationalQuote.position)).where(
            MotivationalQuote.trainer_id == trainer_id
        )
    )
    return 0 if highest is None else highest + 1


def renumber(db: Session, quotes: list[MotivationalQuote]) -> None:
    """Write the queue back, tight and in order, in one go."""
    for index, quote in enumerate(quotes):
        quote.position = index
    db.commit()


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

import uuid
from typing import Any

from sqlalchemy.orm import Session, selectinload

from app.models import Client


def list_clients(db: Session, *, include_inactive: bool = False) -> list[Client]:
    query = db.query(Client)
    if not include_inactive:
        query = query.filter(Client.active.is_(True))
    return query.order_by(Client.full_name).all()


def get_by_id(db: Session, client_id: uuid.UUID) -> Client | None:
    return (
        db.query(Client)
        .options(selectinload(Client.training_plans), selectinload(Client.diet_plans))
        .filter(Client.id == client_id)
        .first()
    )


def create(db: Session, *, trainer_id: uuid.UUID, data: dict[str, Any]) -> Client:
    client = Client(trainer_id=trainer_id, **data)
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


def update(db: Session, client: Client, data: dict[str, Any]) -> Client:
    for field, value in data.items():
        setattr(client, field, value)
    db.commit()
    db.refresh(client)
    return client


def soft_delete(db: Session, client: Client) -> Client:
    client.active = False
    db.commit()
    db.refresh(client)
    return client


def restore(db: Session, client: Client) -> Client:
    client.active = True
    db.commit()
    db.refresh(client)
    return client

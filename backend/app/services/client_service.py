import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Client, Trainer
from app.repositories import client_repository
from app.schemas.client import ClientCreate, ClientUpdate


def list_clients(db: Session, *, include_inactive: bool = False) -> list[Client]:
    return client_repository.list_clients(db, include_inactive=include_inactive)


def get_client(db: Session, client_id: uuid.UUID) -> Client:
    client = client_repository.get_by_id(db, client_id)
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Client not found"
        )
    return client


def create_client(db: Session, trainer: Trainer, data: ClientCreate) -> Client:
    return client_repository.create(db, trainer_id=trainer.id, data=data.model_dump())


def update_client(db: Session, client_id: uuid.UUID, data: ClientUpdate) -> Client:
    client = get_client(db, client_id)
    updates = data.model_dump(exclude_unset=True)
    return client_repository.update(db, client, updates)


def deactivate_client(db: Session, client_id: uuid.UUID) -> Client:
    client = get_client(db, client_id)
    return client_repository.soft_delete(db, client)


def reactivate_client(db: Session, client_id: uuid.UUID) -> Client:
    client = get_client(db, client_id)
    return client_repository.restore(db, client)

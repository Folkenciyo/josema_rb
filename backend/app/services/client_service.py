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


def delete_client(db: Session, client_id: uuid.UUID) -> None:
    """Erase a client for good: plans, weigh-ins, measurements, photos, logged
    sessions and questionnaire answers.

    Deactivating is the everyday way out and keeps all of it. This is the other
    one — the client who asks to be forgotten, or the one created by mistake —
    and it has no undo. The photo files are deleted first: dropping the rows
    would leave their images orphaned on disk with nothing left pointing at them.
    """
    # Imported here and not at the top: photo_service already imports this
    # module to check the client exists, and the two would deadlock on import.
    from app.services import photo_service

    client = get_client(db, client_id)
    photo_service.delete_all_photos(db, client.id)
    client_repository.hard_delete(db, client)


def reactivate_client(db: Session, client_id: uuid.UUID) -> Client:
    client = get_client(db, client_id)
    return client_repository.restore(db, client)

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import get_current_trainer
from app.models import Client, Trainer
from app.schemas.client import ClientCreate, ClientDetailOut, ClientOut, ClientUpdate
from app.services import client_service

router = APIRouter(
    prefix="/api/clients", tags=["clients"], dependencies=[Depends(get_current_trainer)]
)


@router.get("", response_model=list[ClientOut])
def list_clients(
    include_inactive: bool = False, db: Session = Depends(get_db)
) -> list[Client]:
    return client_service.list_clients(db, include_inactive=include_inactive)


@router.post("", response_model=ClientOut, status_code=status.HTTP_201_CREATED)
def create_client(
    payload: ClientCreate,
    trainer: Trainer = Depends(get_current_trainer),
    db: Session = Depends(get_db),
) -> Client:
    return client_service.create_client(db, trainer, payload)


@router.get("/{client_id}", response_model=ClientDetailOut)
def get_client(client_id: uuid.UUID, db: Session = Depends(get_db)) -> Client:
    return client_service.get_client(db, client_id)


@router.patch("/{client_id}", response_model=ClientOut)
def update_client(
    client_id: uuid.UUID, payload: ClientUpdate, db: Session = Depends(get_db)
) -> Client:
    return client_service.update_client(db, client_id, payload)


@router.delete("/{client_id}", response_model=ClientOut)
def deactivate_client(client_id: uuid.UUID, db: Session = Depends(get_db)) -> Client:
    return client_service.deactivate_client(db, client_id)


@router.post("/{client_id}/reactivate", response_model=ClientOut)
def reactivate_client(client_id: uuid.UUID, db: Session = Depends(get_db)) -> Client:
    return client_service.reactivate_client(db, client_id)

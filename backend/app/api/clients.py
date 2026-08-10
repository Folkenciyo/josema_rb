import uuid

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.db import get_db
from app.core.security import get_current_trainer
from app.models import Client, Trainer
from app.schemas.client import ClientCreate, ClientDetailOut, ClientOut, ClientUpdate
from app.schemas.portal import PortalInviteOut, PortalTokenOut
from app.services import client_service, invite_service, portal_service

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


@router.post("/{client_id}/portal-token", response_model=PortalTokenOut)
def issue_portal_token(
    client_id: uuid.UUID, db: Session = Depends(get_db)
) -> PortalTokenOut:
    client = portal_service.issue_token(db, client_id)
    return PortalTokenOut(
        client_id=client.id,
        portal_token=client.portal_token,
        portal_token_issued_at=client.portal_token_issued_at,
    )


@router.get("/{client_id}/portal-invite", response_model=PortalInviteOut)
def get_portal_invite(
    client_id: uuid.UUID,
    request: Request,
    trainer: Trainer = Depends(get_current_trainer),
    db: Session = Depends(get_db),
) -> PortalInviteOut:
    base_url = request.headers.get("origin") or get_settings().public_base_url
    return invite_service.build_invite(db, client_id, trainer, base_url)


@router.delete("/{client_id}/portal-token", response_model=PortalTokenOut)
def revoke_portal_token(
    client_id: uuid.UUID, db: Session = Depends(get_db)
) -> PortalTokenOut:
    client = portal_service.revoke_token(db, client_id)
    return PortalTokenOut(
        client_id=client.id,
        portal_token=None,
        portal_token_issued_at=None,
    )

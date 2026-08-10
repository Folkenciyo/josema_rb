import secrets
import uuid
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Client
from app.repositories import client_repository, measurement_repository
from app.schemas.portal import PortalClientOut
from app.services import client_service

# 32 bytes of entropy, ~43 url-safe characters. Long enough that guessing is
# hopeless, short enough to fit in a WhatsApp message without wrapping badly.
TOKEN_BYTES = 32


def issue_token(db: Session, client_id: uuid.UUID) -> Client:
    """Create the portal link, or replace the previous one.

    Regenerating is how a leaked link is dealt with: the old token stops
    resolving the moment the new one is stored.
    """
    client = client_service.get_client(db, client_id)
    return client_repository.update(
        db,
        client,
        {
            "portal_token": secrets.token_urlsafe(TOKEN_BYTES),
            "portal_token_issued_at": datetime.now(UTC),
        },
    )


def revoke_token(db: Session, client_id: uuid.UUID) -> Client:
    client = client_service.get_client(db, client_id)
    return client_repository.update(
        db, client, {"portal_token": None, "portal_token_issued_at": None}
    )


def resolve_token(db: Session, token: str) -> Client:
    """Turn a token into its client, or refuse to say anything at all.

    A revoked token, an unknown one and a client on hold all answer the same
    404: the portal never confirms whether a link ever existed.
    """
    client = client_repository.get_by_portal_token(db, token)
    if client is None or not client.active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Portal link not found"
        )
    return client


def build_portal_view(db: Session, client: Client) -> PortalClientOut:
    measurements = measurement_repository.list_for_client(db, client.id)
    latest = measurements[0] if measurements else None

    return PortalClientOut(
        full_name=client.full_name,
        goals=client.goals,
        latest_weight_kg=float(latest.weight_kg) if latest else None,
        latest_weighed_on=latest.measured_on if latest else None,
    )

import secrets
import uuid
from datetime import UTC, date, datetime
from pathlib import Path

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Client, ClientMeasurement, DietPlan, TrainingPlan
from app.repositories import (
    client_repository,
    diet_plan_repository,
    measurement_repository,
    photo_repository,
    training_plan_repository,
    workout_repository,
)
from app.schemas.portal import PortalClientOut, PortalPhotoOut, PortalWeighInOut
from app.services import (
    client_service,
    measurement_service,
    photo_service,
    quote_service,
)

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


def grant_photo_consent(db: Session, client: Client) -> Client:
    """Recorded with the server's clock: a consent date typed by a phone is worth
    nothing as a record."""
    return client_repository.update(db, client, {"photo_consent_at": datetime.now(UTC)})


def withdraw_photo_consent(db: Session, client: Client) -> Client:
    """Withdrawing only says "no from now on"; it does not delete anything.

    Deleting the photos is a separate, explicit act, because it cannot be undone
    and the client may only want to stop new ones being taken.
    """
    return client_repository.update(db, client, {"photo_consent_at": None})


def _require_photo_consent(client: Client) -> None:
    """The same act that allows keeping the photos is what opens them.

    Withdrawing the permission therefore closes the gallery too, even though the
    files stay until the client asks for them to be deleted.
    """
    if client.photo_consent_at is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Photo consent not granted"
        )


def list_photos(db: Session, client: Client) -> list[PortalPhotoOut]:
    _require_photo_consent(client)
    return [
        PortalPhotoOut.model_validate(photo)
        for photo in photo_repository.list_for_client(db, client.id)
    ]


def photo_file(
    db: Session, client: Client, photo_id: uuid.UUID, *, thumbnail: bool
) -> Path:
    """A photo of this client, or nothing.

    Someone else's id answers the same 404 as one that never existed: the portal
    never confirms what other clients have.
    """
    _require_photo_consent(client)

    photo = photo_repository.get_by_id(db, photo_id)
    if photo is None or photo.client_id != client.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found"
        )

    return photo_service.photo_file(db, photo_id, thumbnail=thumbnail)


def build_portal_view(db: Session, client: Client) -> PortalClientOut:
    measurements = measurement_repository.list_for_client(db, client.id)
    latest = measurements[0] if measurements else None

    return PortalClientOut(
        full_name=client.full_name,
        goals=client.goals,
        latest_weight_kg=float(latest.weight_kg) if latest else None,
        latest_weighed_on=latest.measured_on if latest else None,
        has_training_plan=(
            training_plan_repository.get_active_for_client(db, client.id) is not None
        ),
        has_diet_plan=(
            diet_plan_repository.get_active_for_client(db, client.id) is not None
        ),
        weigh_in_count=len(measurements),
        photo_consent_at=client.photo_consent_at,
        photo_count=len(photo_repository.list_for_client(db, client.id)),
        workout_count=workout_repository.count_for_client(db, client.id),
        quote=quote_service.quote_for_client(db, client),
    )


def record_weigh_in(db: Session, client: Client, weight_kg: float) -> PortalWeighInOut:
    """Save today's weight, replacing today's entry if the client corrects it.

    Overwriting instead of refusing is deliberate: from a phone, a typo would
    otherwise leave the client stuck with a wrong number they cannot edit.
    """
    today = date.today()
    existing = measurement_repository.get_by_day(db, client.id, today)

    if existing is not None:
        measurement = measurement_repository.update(
            db, existing, {"weight_kg": weight_kg}
        )
    else:
        measurement = measurement_repository.create(
            db,
            client_id=client.id,
            data={"measured_on": today, "weight_kg": weight_kg},
        )

    return _to_weigh_in(measurement, client)


def _to_weigh_in(measurement: ClientMeasurement, client: Client) -> PortalWeighInOut:
    return PortalWeighInOut(
        id=measurement.id,
        measured_on=measurement.measured_on,
        weight_kg=float(measurement.weight_kg),
        bmi=measurement_service.calculate_bmi(
            float(measurement.weight_kg), client.height_cm
        ),
    )


def list_weigh_ins(db: Session, client: Client) -> list[PortalWeighInOut]:
    return [
        PortalWeighInOut(
            id=measurement.id,
            measured_on=measurement.measured_on,
            weight_kg=measurement.weight_kg,
            bmi=measurement.bmi,
        )
        for measurement in measurement_service.list_measurements(db, client.id)
    ]


def get_active_training_plan(db: Session, client: Client) -> TrainingPlan:
    """The client's own plan, resolved from the client — never from an id in the URL."""
    plan = training_plan_repository.get_active_for_client(db, client.id)
    if plan is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No active training plan"
        )
    return plan


def get_active_diet_plan(db: Session, client: Client) -> DietPlan:
    plan = diet_plan_repository.get_active_for_client(db, client.id)
    if plan is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No active diet plan"
        )
    return plan

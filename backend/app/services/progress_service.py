"""Builds the progress document: two dates face to face, with photos and weight."""

import uuid
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import (
    BODY_ZONES,
    Client,
    ClientBodyMeasurement,
    ClientMeasurement,
    ClientPhoto,
    PhotoPose,
)
from app.repositories import measurement_repository, photo_repository
from app.schemas.export import (
    ProgressDocument,
    ProgressRow,
    ProgressSide,
    ProgressZone,
)
from app.services import client_service
from app.services.measurement_service import calculate_bmi

POSE_LABELS_ES: dict[PhotoPose, str] = {
    PhotoPose.FRONT: "Frontal",
    PhotoPose.SIDE: "Lateral",
    PhotoPose.BACK: "Trasera",
}

ZONE_LABELS_ES: dict[str, str] = {
    "neck_cm": "Cuello",
    "chest_cm": "Pecho",
    "arm_right_cm": "Brazo derecho",
    "arm_left_cm": "Brazo izquierdo",
    "forearm_cm": "Antebrazo",
    "waist_cm": "Cintura",
    "hip_cm": "Cadera",
    "thigh_cm": "Muslo",
    "calf_cm": "Gemelo",
}


def photo_dates(photos: list[ClientPhoto]) -> list[date]:
    """Every date with at least one photo, oldest first."""
    return sorted({photo.taken_on for photo in photos})


def photos_on(
    photos: list[ClientPhoto], taken_on: date
) -> dict[PhotoPose, ClientPhoto | None]:
    session = {pose: None for pose in PhotoPose}
    for photo in photos:
        if photo.taken_on == taken_on:
            session[photo.pose] = photo
    return session


def nearest_measurement[Dated: (ClientMeasurement, ClientBodyMeasurement)](
    measurements: list[Dated], target: date
) -> Dated | None:
    """The entry closest to a date, so a photo can carry the numbers of its day.

    Ties go to the earlier one: that is the entry that already existed when the
    photo was taken. Used for both the weigh-ins and the tape readings.
    """
    if not measurements:
        return None

    return min(
        measurements,
        key=lambda measurement: (
            abs((measurement.measured_on - target).days),
            measurement.measured_on,
        ),
    )


def _build_zones(
    before: ClientBodyMeasurement | None, after: ClientBodyMeasurement | None
) -> list[ProgressZone]:
    zones = []

    for zone in BODY_ZONES:
        before_cm = getattr(before, zone, None) if before else None
        after_cm = getattr(after, zone, None) if after else None

        if before_cm is None and after_cm is None:
            continue

        zones.append(
            ProgressZone(
                label_es=ZONE_LABELS_ES[zone],
                before_cm=float(before_cm) if before_cm is not None else None,
                after_cm=float(after_cm) if after_cm is not None else None,
                # No difference to show when both ends resolved to the same
                # entry: with a single set of readings there is nothing to
                # compare, only a number to state.
                delta_cm=(
                    round(float(after_cm) - float(before_cm), 1)
                    if before_cm is not None
                    and after_cm is not None
                    and before is not after
                    else None
                ),
            )
        )

    return zones


def _build_side(
    client: Client, measurements: list[ClientMeasurement], taken_on: date
) -> ProgressSide:
    measurement = nearest_measurement(measurements, taken_on)
    weight = float(measurement.weight_kg) if measurement else None

    return ProgressSide(
        taken_on=taken_on,
        weight_kg=weight,
        weight_measured_on=measurement.measured_on if measurement else None,
        bmi=calculate_bmi(weight, client.height_cm) if weight else None,
    )


def build_progress_document(
    db: Session,
    client_id: uuid.UUID,
    *,
    before: date | None = None,
    after: date | None = None,
) -> ProgressDocument:
    """Defaults to the first and the last session, which is the widest comparison."""
    client = client_service.get_client(db, client_id)
    photos = photo_repository.list_for_client(db, client_id)
    dates = photo_dates(photos)

    if len(dates) < 2 and (before is None or after is None):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="At least two dates with photos are needed to compare",
        )

    before_date = before or dates[0]
    after_date = after or dates[-1]
    measurements = measurement_repository.list_for_client(db, client_id)

    before_side = _build_side(client, measurements, before_date)
    after_side = _build_side(client, measurements, after_date)

    before_photos = photos_on(photos, before_date)
    after_photos = photos_on(photos, after_date)

    delta = None
    if (
        before_side.weight_kg is not None
        and after_side.weight_kg is not None
        and before_side.weight_measured_on != after_side.weight_measured_on
    ):
        delta = round(after_side.weight_kg - before_side.weight_kg, 1)

    body_measurements = measurement_repository.list_body_for_client(db, client_id)
    before_body = nearest_measurement(body_measurements, before_date)
    after_body = nearest_measurement(body_measurements, after_date)

    return ProgressDocument(
        client_name=client.full_name,
        before=before_side,
        after=after_side,
        weight_delta_kg=delta,
        zones=_build_zones(before_body, after_body),
        zones_before_on=before_body.measured_on if before_body else None,
        zones_after_on=after_body.measured_on if after_body else None,
        rows=[
            ProgressRow(
                pose_label_es=POSE_LABELS_ES[pose],
                before_image=(
                    before_photos[pose].file_path if before_photos[pose] else None
                ),
                after_image=(
                    after_photos[pose].file_path if after_photos[pose] else None
                ),
            )
            # Always the three poses: a missing shot is a visible gap, never a
            # row shifted to fill the hole.
            for pose in PhotoPose
        ],
    )

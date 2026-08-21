import uuid
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Client, ClientBodyMeasurement, ClientMeasurement
from app.repositories import measurement_repository
from app.schemas.measurement import (
    BodyMeasurementCreate,
    BodyMeasurementOut,
    BodyMeasurementUpdate,
    MeasurementCreate,
    MeasurementOut,
    MeasurementUpdate,
)
from app.services import client_service

CM_PER_METRE = 100


def calculate_bmi(weight_kg: float, height_cm: float | None) -> float | None:
    """Body mass index, rounded like the app shows it. Needs a usable height."""
    if not height_cm:
        return None

    height_m = float(height_cm) / CM_PER_METRE
    return round(weight_kg / (height_m**2), 1)


def _to_out(measurement: ClientMeasurement, client: Client) -> MeasurementOut:
    return MeasurementOut.model_validate(measurement).model_copy(
        update={"bmi": calculate_bmi(float(measurement.weight_kg), client.height_cm)}
    )


def list_measurements(db: Session, client_id: uuid.UUID) -> list[MeasurementOut]:
    client = client_service.get_client(db, client_id)
    return [
        _to_out(measurement, client)
        for measurement in measurement_repository.list_for_client(db, client_id)
    ]


def _get_measurement(db: Session, measurement_id: uuid.UUID) -> ClientMeasurement:
    measurement = measurement_repository.get_by_id(db, measurement_id)
    if measurement is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Measurement not found"
        )
    return measurement


def create_measurement(
    db: Session, client_id: uuid.UUID, data: MeasurementCreate
) -> MeasurementOut:
    client = client_service.get_client(db, client_id)
    _reject_duplicate_day(db, client_id, data.measured_on)

    measurement = measurement_repository.create(
        db, client_id=client_id, data=data.model_dump()
    )
    return _to_out(measurement, client)


def update_measurement(
    db: Session, measurement_id: uuid.UUID, data: MeasurementUpdate
) -> MeasurementOut:
    measurement = _get_measurement(db, measurement_id)
    updates = data.model_dump(exclude_unset=True)

    new_day = updates.get("measured_on")
    if new_day is not None and new_day != measurement.measured_on:
        _reject_duplicate_day(db, measurement.client_id, new_day)

    client = client_service.get_client(db, measurement.client_id)
    return _to_out(measurement_repository.update(db, measurement, updates), client)


def delete_measurement(db: Session, measurement_id: uuid.UUID) -> None:
    measurement_repository.delete(db, _get_measurement(db, measurement_id))


def _reject_duplicate_day(db: Session, client_id: uuid.UUID, measured_on: date) -> None:
    """One weigh-in per day keeps the chart honest and the edit flow obvious."""
    if measurement_repository.get_by_day(db, client_id, measured_on) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This client already has a measurement on that day",
        )


def list_body_measurements(
    db: Session, client_id: uuid.UUID
) -> list[BodyMeasurementOut]:
    client_service.get_client(db, client_id)
    return [
        BodyMeasurementOut.model_validate(measurement)
        for measurement in measurement_repository.list_body_for_client(db, client_id)
    ]


def _get_body_measurement(
    db: Session, measurement_id: uuid.UUID
) -> ClientBodyMeasurement:
    measurement = measurement_repository.get_body_by_id(db, measurement_id)
    if measurement is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Measurement not found"
        )
    return measurement


def create_body_measurement(
    db: Session, client_id: uuid.UUID, data: BodyMeasurementCreate
) -> BodyMeasurementOut:
    client_service.get_client(db, client_id)
    _reject_duplicate_body_day(db, client_id, data.measured_on)

    measurement = measurement_repository.create_body(
        db, client_id=client_id, data=data.model_dump()
    )
    return BodyMeasurementOut.model_validate(measurement)


def update_body_measurement(
    db: Session, measurement_id: uuid.UUID, data: BodyMeasurementUpdate
) -> BodyMeasurementOut:
    measurement = _get_body_measurement(db, measurement_id)
    updates = data.model_dump(exclude_unset=True)

    new_day = updates.get("measured_on")
    if new_day is not None and new_day != measurement.measured_on:
        _reject_duplicate_body_day(db, measurement.client_id, new_day)

    return BodyMeasurementOut.model_validate(
        measurement_repository.update(db, measurement, updates)
    )


def delete_body_measurement(db: Session, measurement_id: uuid.UUID) -> None:
    measurement_repository.delete(db, _get_body_measurement(db, measurement_id))


def _reject_duplicate_body_day(
    db: Session, client_id: uuid.UUID, measured_on: date
) -> None:
    """One set of tape readings per day, same rule as the weigh-in."""
    if measurement_repository.get_body_by_day(db, client_id, measured_on) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This client already has body measurements on that day",
        )

import uuid
from datetime import date
from typing import Any

from sqlalchemy.orm import Session

from app.models import ClientBodyMeasurement, ClientMeasurement

# Weigh-ins and tape readings are stored apart but handled the same way: one row
# per client and day, edited in place.
Measurement = ClientMeasurement | ClientBodyMeasurement


def _persist(db: Session, measurement: Measurement) -> Measurement:
    db.add(measurement)
    db.commit()
    db.refresh(measurement)
    return measurement


def list_for_client(db: Session, client_id: uuid.UUID) -> list[ClientMeasurement]:
    return (
        db.query(ClientMeasurement)
        .filter(ClientMeasurement.client_id == client_id)
        .order_by(ClientMeasurement.measured_on.desc())
        .all()
    )


def get_by_id(db: Session, measurement_id: uuid.UUID) -> ClientMeasurement | None:
    return (
        db.query(ClientMeasurement)
        .filter(ClientMeasurement.id == measurement_id)
        .first()
    )


def get_by_day(
    db: Session, client_id: uuid.UUID, measured_on: date
) -> ClientMeasurement | None:
    return (
        db.query(ClientMeasurement)
        .filter(
            ClientMeasurement.client_id == client_id,
            ClientMeasurement.measured_on == measured_on,
        )
        .first()
    )


def create(
    db: Session, *, client_id: uuid.UUID, data: dict[str, Any]
) -> ClientMeasurement:
    return _persist(db, ClientMeasurement(client_id=client_id, **data))


def update(db: Session, measurement: Measurement, data: dict[str, Any]) -> Measurement:
    for field, value in data.items():
        setattr(measurement, field, value)
    db.commit()
    db.refresh(measurement)
    return measurement


def delete(db: Session, measurement: Measurement) -> None:
    db.delete(measurement)
    db.commit()


def list_body_for_client(
    db: Session, client_id: uuid.UUID
) -> list[ClientBodyMeasurement]:
    return (
        db.query(ClientBodyMeasurement)
        .filter(ClientBodyMeasurement.client_id == client_id)
        .order_by(ClientBodyMeasurement.measured_on.desc())
        .all()
    )


def get_body_by_id(
    db: Session, measurement_id: uuid.UUID
) -> ClientBodyMeasurement | None:
    return (
        db.query(ClientBodyMeasurement)
        .filter(ClientBodyMeasurement.id == measurement_id)
        .first()
    )


def get_body_by_day(
    db: Session, client_id: uuid.UUID, measured_on: date
) -> ClientBodyMeasurement | None:
    return (
        db.query(ClientBodyMeasurement)
        .filter(
            ClientBodyMeasurement.client_id == client_id,
            ClientBodyMeasurement.measured_on == measured_on,
        )
        .first()
    )


def create_body(
    db: Session, *, client_id: uuid.UUID, data: dict[str, Any]
) -> ClientBodyMeasurement:
    return _persist(db, ClientBodyMeasurement(client_id=client_id, **data))

import uuid
from datetime import date
from typing import Any

from sqlalchemy.orm import Session

from app.models import ClientMeasurement


def list_for_client(db: Session, client_id: uuid.UUID) -> list[ClientMeasurement]:
    return (
        db.query(ClientMeasurement)
        .filter(ClientMeasurement.client_id == client_id)
        .order_by(ClientMeasurement.measured_on.desc())
        .all()
    )


def get_by_id(
    db: Session, measurement_id: uuid.UUID
) -> ClientMeasurement | None:
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
    measurement = ClientMeasurement(client_id=client_id, **data)
    db.add(measurement)
    db.commit()
    db.refresh(measurement)
    return measurement


def update(
    db: Session, measurement: ClientMeasurement, data: dict[str, Any]
) -> ClientMeasurement:
    for field, value in data.items():
        setattr(measurement, field, value)
    db.commit()
    db.refresh(measurement)
    return measurement


def delete(db: Session, measurement: ClientMeasurement) -> None:
    db.delete(measurement)
    db.commit()

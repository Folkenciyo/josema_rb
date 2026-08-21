import uuid

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import get_current_trainer
from app.schemas.measurement import (
    BodyMeasurementCreate,
    BodyMeasurementOut,
    BodyMeasurementUpdate,
    MeasurementCreate,
    MeasurementOut,
    MeasurementUpdate,
)
from app.services import measurement_service

router = APIRouter(tags=["measurements"], dependencies=[Depends(get_current_trainer)])


@router.get(
    "/api/clients/{client_id}/measurements", response_model=list[MeasurementOut]
)
def list_measurements(
    client_id: uuid.UUID, db: Session = Depends(get_db)
) -> list[MeasurementOut]:
    return measurement_service.list_measurements(db, client_id)


@router.post(
    "/api/clients/{client_id}/measurements",
    response_model=MeasurementOut,
    status_code=status.HTTP_201_CREATED,
)
def create_measurement(
    client_id: uuid.UUID,
    payload: MeasurementCreate,
    db: Session = Depends(get_db),
) -> MeasurementOut:
    return measurement_service.create_measurement(db, client_id, payload)


@router.patch("/api/measurements/{measurement_id}", response_model=MeasurementOut)
def update_measurement(
    measurement_id: uuid.UUID,
    payload: MeasurementUpdate,
    db: Session = Depends(get_db),
) -> MeasurementOut:
    return measurement_service.update_measurement(db, measurement_id, payload)


@router.delete(
    "/api/measurements/{measurement_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_measurement(
    measurement_id: uuid.UUID, db: Session = Depends(get_db)
) -> Response:
    measurement_service.delete_measurement(db, measurement_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/api/clients/{client_id}/body-measurements",
    response_model=list[BodyMeasurementOut],
)
def list_body_measurements(
    client_id: uuid.UUID, db: Session = Depends(get_db)
) -> list[BodyMeasurementOut]:
    return measurement_service.list_body_measurements(db, client_id)


@router.post(
    "/api/clients/{client_id}/body-measurements",
    response_model=BodyMeasurementOut,
    status_code=status.HTTP_201_CREATED,
)
def create_body_measurement(
    client_id: uuid.UUID,
    payload: BodyMeasurementCreate,
    db: Session = Depends(get_db),
) -> BodyMeasurementOut:
    return measurement_service.create_body_measurement(db, client_id, payload)


@router.patch(
    "/api/body-measurements/{measurement_id}", response_model=BodyMeasurementOut
)
def update_body_measurement(
    measurement_id: uuid.UUID,
    payload: BodyMeasurementUpdate,
    db: Session = Depends(get_db),
) -> BodyMeasurementOut:
    return measurement_service.update_body_measurement(db, measurement_id, payload)


@router.delete(
    "/api/body-measurements/{measurement_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_body_measurement(
    measurement_id: uuid.UUID, db: Session = Depends(get_db)
) -> Response:
    measurement_service.delete_body_measurement(db, measurement_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

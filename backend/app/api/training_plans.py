import io
import uuid

from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import get_current_trainer
from app.models import Trainer, TrainingPlan, TrainingWeek
from app.schemas.training_plan import (
    CopyTrainingPlanRequest,
    DuplicateWeekRequest,
    SetTrainingDaysRequest,
    TrainingPlanCreate,
    TrainingPlanDetailOut,
    TrainingPlanOut,
    TrainingPlanUpdate,
    TrainingWeekCreate,
    TrainingWeekDetailOut,
)
from app.services import (
    client_service,
    docx_export,
    export_service,
    pdf_export,
    training_plan_service,
)

router = APIRouter(tags=["training-plans"], dependencies=[Depends(get_current_trainer)])


@router.get(
    "/api/clients/{client_id}/training-plans", response_model=list[TrainingPlanOut]
)
def list_training_plans(
    client_id: uuid.UUID, db: Session = Depends(get_db)
) -> list[TrainingPlan]:
    client_service.get_client(db, client_id)
    return training_plan_service.list_plans_for_client(db, client_id)


@router.post(
    "/api/clients/{client_id}/training-plans",
    response_model=TrainingPlanOut,
    status_code=status.HTTP_201_CREATED,
)
def create_training_plan(
    client_id: uuid.UUID, payload: TrainingPlanCreate, db: Session = Depends(get_db)
) -> TrainingPlan:
    client = client_service.get_client(db, client_id)
    return training_plan_service.create_plan(db, client, payload)


@router.post(
    "/api/clients/{client_id}/training-plans/from/{source_plan_id}",
    response_model=TrainingPlanOut,
    status_code=status.HTTP_201_CREATED,
)
def copy_training_plan_to_client(
    client_id: uuid.UUID,
    source_plan_id: uuid.UUID,
    payload: CopyTrainingPlanRequest,
    db: Session = Depends(get_db),
) -> TrainingPlan:
    """Start this client from a template, or from what already works for another.

    The copy lands as a draft with no dates: the trainer adjusts it and decides
    when it starts, instead of a second plan quietly going live.
    """
    client = client_service.get_client(db, client_id)
    return training_plan_service.copy_plan(
        db, source_plan_id, client_id=client.id, title=payload.title
    )


@router.get("/api/training-templates", response_model=list[TrainingPlanOut])
def list_training_templates(
    trainer: Trainer = Depends(get_current_trainer), db: Session = Depends(get_db)
) -> list[TrainingPlan]:
    return training_plan_service.list_templates(db, trainer)


@router.post(
    "/api/training-templates",
    response_model=TrainingPlanOut,
    status_code=status.HTTP_201_CREATED,
)
def create_training_template(
    payload: TrainingPlanCreate,
    trainer: Trainer = Depends(get_current_trainer),
    db: Session = Depends(get_db),
) -> TrainingPlan:
    return training_plan_service.create_template(db, trainer, payload)


@router.post(
    "/api/training-plans/{plan_id}/save-as-template",
    response_model=TrainingPlanOut,
    status_code=status.HTTP_201_CREATED,
)
def save_plan_as_template(
    plan_id: uuid.UUID,
    payload: CopyTrainingPlanRequest,
    trainer: Trainer = Depends(get_current_trainer),
    db: Session = Depends(get_db),
) -> TrainingPlan:
    """Templates worth having are the ones that already worked with somebody."""
    return training_plan_service.copy_plan(
        db, plan_id, trainer_id=trainer.id, title=payload.title
    )


@router.get("/api/training-plans/{plan_id}", response_model=TrainingPlanDetailOut)
def get_training_plan(
    plan_id: uuid.UUID, db: Session = Depends(get_db)
) -> TrainingPlan:
    return training_plan_service.get_plan(db, plan_id)


@router.patch("/api/training-plans/{plan_id}", response_model=TrainingPlanOut)
def update_training_plan(
    plan_id: uuid.UUID, payload: TrainingPlanUpdate, db: Session = Depends(get_db)
) -> TrainingPlan:
    return training_plan_service.update_plan(db, plan_id, payload)


@router.delete("/api/training-plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_training_plan(plan_id: uuid.UUID, db: Session = Depends(get_db)) -> None:
    training_plan_service.delete_plan(db, plan_id)


@router.post(
    "/api/training-plans/{plan_id}/weeks",
    response_model=TrainingWeekDetailOut,
    status_code=status.HTTP_201_CREATED,
)
def add_training_week(
    plan_id: uuid.UUID, payload: TrainingWeekCreate, db: Session = Depends(get_db)
) -> TrainingWeek:
    return training_plan_service.add_week(db, plan_id, payload)


@router.put("/api/training-weeks/{week_id}/days", response_model=TrainingWeekDetailOut)
def set_training_week_days(
    week_id: uuid.UUID, payload: SetTrainingDaysRequest, db: Session = Depends(get_db)
) -> TrainingWeek:
    return training_plan_service.set_week_days(db, week_id, payload)


@router.post(
    "/api/training-weeks/{week_id}/duplicate",
    response_model=TrainingWeekDetailOut,
    status_code=status.HTTP_201_CREATED,
)
def duplicate_training_week(
    week_id: uuid.UUID, payload: DuplicateWeekRequest, db: Session = Depends(get_db)
) -> TrainingWeek:
    return training_plan_service.duplicate_week(db, week_id, payload.week_number)


@router.get("/api/training-plans/{plan_id}/export/pdf")
def export_training_plan_pdf(
    plan_id: uuid.UUID, db: Session = Depends(get_db)
) -> StreamingResponse:
    document = export_service.build_training_plan_document(db, plan_id)
    pdf_bytes = pdf_export.render_training_plan_pdf(document)
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": 'attachment; filename="plan-entrenamiento.pdf"'
        },
    )


@router.get("/api/training-plans/{plan_id}/export/docx")
def export_training_plan_docx(
    plan_id: uuid.UUID, db: Session = Depends(get_db)
) -> StreamingResponse:
    document = export_service.build_training_plan_document(db, plan_id)
    docx_bytes = docx_export.render_training_plan_docx(document)
    return StreamingResponse(
        io.BytesIO(docx_bytes),
        media_type=(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ),
        headers={
            "Content-Disposition": 'attachment; filename="plan-entrenamiento.docx"'
        },
    )

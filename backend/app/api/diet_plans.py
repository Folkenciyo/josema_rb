import io
import uuid

from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import get_current_trainer
from app.models import DietPlan
from app.schemas.diet_plan import (
    AssignMenuRequest,
    DietPlanCreate,
    DietPlanDetailOut,
    DietPlanOut,
    DietPlanUpdate,
    DietWeekCreate,
    DietWeekDetailOut,
    DuplicateWeekRequest,
    SetDietDaysRequest,
)
from app.services import (
    client_service,
    diet_plan_service,
    docx_export,
    export_service,
    pdf_export,
)

router = APIRouter(tags=["diet-plans"], dependencies=[Depends(get_current_trainer)])


@router.get("/api/clients/{client_id}/diet-plans", response_model=list[DietPlanOut])
def list_diet_plans(
    client_id: uuid.UUID, db: Session = Depends(get_db)
) -> list[DietPlan]:
    client_service.get_client(db, client_id)
    return diet_plan_service.list_plans_for_client(db, client_id)


@router.post(
    "/api/clients/{client_id}/diet-plans",
    response_model=DietPlanOut,
    status_code=status.HTTP_201_CREATED,
)
def create_diet_plan(
    client_id: uuid.UUID, payload: DietPlanCreate, db: Session = Depends(get_db)
) -> DietPlan:
    client = client_service.get_client(db, client_id)
    return diet_plan_service.create_plan(db, client, payload)


@router.get("/api/diet-plans/{plan_id}", response_model=DietPlanDetailOut)
def get_diet_plan(
    plan_id: uuid.UUID, db: Session = Depends(get_db)
) -> DietPlanDetailOut:
    plan = diet_plan_service.get_plan(db, plan_id)
    return diet_plan_service.to_plan_out(plan)


@router.patch("/api/diet-plans/{plan_id}", response_model=DietPlanOut)
def update_diet_plan(
    plan_id: uuid.UUID, payload: DietPlanUpdate, db: Session = Depends(get_db)
) -> DietPlan:
    return diet_plan_service.update_plan(db, plan_id, payload)


@router.delete("/api/diet-plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_diet_plan(plan_id: uuid.UUID, db: Session = Depends(get_db)) -> None:
    diet_plan_service.delete_plan(db, plan_id)


@router.post(
    "/api/diet-plans/{plan_id}/weeks",
    response_model=DietWeekDetailOut,
    status_code=status.HTTP_201_CREATED,
)
def add_diet_week(
    plan_id: uuid.UUID, payload: DietWeekCreate, db: Session = Depends(get_db)
) -> DietWeekDetailOut:
    week = diet_plan_service.add_week(db, plan_id, payload)
    return diet_plan_service.to_week_out(week)


@router.put("/api/diet-weeks/{week_id}/days", response_model=DietWeekDetailOut)
def set_diet_week_days(
    week_id: uuid.UUID, payload: SetDietDaysRequest, db: Session = Depends(get_db)
) -> DietWeekDetailOut:
    week = diet_plan_service.set_week_days(db, week_id, payload)
    return diet_plan_service.to_week_out(week)


@router.post(
    "/api/diet-weeks/{week_id}/duplicate",
    response_model=DietWeekDetailOut,
    status_code=status.HTTP_201_CREATED,
)
def duplicate_diet_week(
    week_id: uuid.UUID, payload: DuplicateWeekRequest, db: Session = Depends(get_db)
) -> DietWeekDetailOut:
    week = diet_plan_service.duplicate_week(db, week_id, payload.week_number)
    return diet_plan_service.to_week_out(week)


@router.post("/api/diet-weeks/{week_id}/assign-menu", response_model=DietWeekDetailOut)
def assign_menu_to_diet_week(
    week_id: uuid.UUID, payload: AssignMenuRequest, db: Session = Depends(get_db)
) -> DietWeekDetailOut:
    week = diet_plan_service.assign_menu(db, week_id, payload)
    return diet_plan_service.to_week_out(week)


@router.get("/api/diet-plans/{plan_id}/export/pdf")
def export_diet_plan_pdf(
    plan_id: uuid.UUID, db: Session = Depends(get_db)
) -> StreamingResponse:
    document = export_service.build_diet_plan_document(db, plan_id)
    pdf_bytes = pdf_export.render_diet_plan_pdf(document)
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="plan-dieta.pdf"'},
    )


@router.get("/api/diet-plans/{plan_id}/export/docx")
def export_diet_plan_docx(
    plan_id: uuid.UUID, db: Session = Depends(get_db)
) -> StreamingResponse:
    document = export_service.build_diet_plan_document(db, plan_id)
    docx_bytes = docx_export.render_diet_plan_docx(document)
    return StreamingResponse(
        io.BytesIO(docx_bytes),
        media_type=(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ),
        headers={"Content-Disposition": 'attachment; filename="plan-dieta.docx"'},
    )

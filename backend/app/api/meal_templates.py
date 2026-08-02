import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import get_current_trainer
from app.models import Trainer
from app.schemas.meal_template import (
    MealTemplateCreate,
    MealTemplateOut,
    MealTemplateUpdate,
)
from app.services import meal_template_service

router = APIRouter(
    prefix="/api/meal-templates",
    tags=["meal-templates"],
    dependencies=[Depends(get_current_trainer)],
)


@router.get("", response_model=list[MealTemplateOut])
def list_meal_templates(
    db: Session = Depends(get_db), trainer: Trainer = Depends(get_current_trainer)
) -> list[MealTemplateOut]:
    meal_templates = meal_template_service.list_meal_templates(db, trainer)
    return [meal_template_service.to_out(mt) for mt in meal_templates]


@router.post("", response_model=MealTemplateOut, status_code=status.HTTP_201_CREATED)
def create_meal_template(
    payload: MealTemplateCreate,
    trainer: Trainer = Depends(get_current_trainer),
    db: Session = Depends(get_db),
) -> MealTemplateOut:
    meal_template = meal_template_service.create_meal_template(db, trainer, payload)
    return meal_template_service.to_out(meal_template)


@router.get("/{meal_template_id}", response_model=MealTemplateOut)
def get_meal_template(
    meal_template_id: uuid.UUID, db: Session = Depends(get_db)
) -> MealTemplateOut:
    meal_template = meal_template_service.get_meal_template(db, meal_template_id)
    return meal_template_service.to_out(meal_template)


@router.patch("/{meal_template_id}", response_model=MealTemplateOut)
def update_meal_template(
    meal_template_id: uuid.UUID,
    payload: MealTemplateUpdate,
    db: Session = Depends(get_db),
) -> MealTemplateOut:
    meal_template = meal_template_service.update_meal_template(
        db, meal_template_id, payload
    )
    return meal_template_service.to_out(meal_template)


@router.delete("/{meal_template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meal_template(
    meal_template_id: uuid.UUID, db: Session = Depends(get_db)
) -> None:
    meal_template_service.delete_meal_template(db, meal_template_id)

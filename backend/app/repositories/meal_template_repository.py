import uuid
from typing import Any

from sqlalchemy.orm import Session, selectinload

from app.models import MealTemplate, MealTemplateItem, MenuMeal


def list_meal_templates(db: Session, trainer_id: uuid.UUID) -> list[MealTemplate]:
    return (
        db.query(MealTemplate)
        .options(selectinload(MealTemplate.items))
        .filter(MealTemplate.trainer_id == trainer_id)
        .order_by(MealTemplate.name)
        .all()
    )


def get_by_id(db: Session, meal_template_id: uuid.UUID) -> MealTemplate | None:
    return (
        db.query(MealTemplate)
        .options(selectinload(MealTemplate.items))
        .filter(MealTemplate.id == meal_template_id)
        .first()
    )


def create(db: Session, meal_template: MealTemplate) -> MealTemplate:
    db.add(meal_template)
    db.commit()
    db.refresh(meal_template)
    return meal_template


def update_fields(
    db: Session, meal_template: MealTemplate, data: dict[str, Any]
) -> MealTemplate:
    for field, value in data.items():
        setattr(meal_template, field, value)
    db.commit()
    db.refresh(meal_template)
    return meal_template


def replace_items(
    db: Session, meal_template: MealTemplate, items: list[MealTemplateItem]
) -> MealTemplate:
    meal_template.items = items
    db.commit()
    db.refresh(meal_template)
    return meal_template


def delete(db: Session, meal_template: MealTemplate) -> None:
    db.delete(meal_template)
    db.commit()


def is_in_use(db: Session, meal_template_id: uuid.UUID) -> bool:
    return (
        db.query(MenuMeal).filter(MenuMeal.meal_template_id == meal_template_id).first()
        is not None
    )

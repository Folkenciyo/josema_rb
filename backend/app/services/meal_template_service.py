import uuid
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import MealTemplate, MealTemplateItem, Trainer
from app.repositories import food_repository, meal_template_repository
from app.schemas.meal_template import (
    MacroTotals,
    MealTemplateCreate,
    MealTemplateItemCreate,
    MealTemplateOut,
    MealTemplateUpdate,
)


def _build_item(
    db: Session, data: MealTemplateItemCreate, order_index: int
) -> MealTemplateItem:
    if data.food_id is not None:
        food = food_repository.get_by_id(db, data.food_id)
        if food is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Food {data.food_id} not found",
            )
        multiplier = Decimal(str(data.quantity_multiplier or 1))
        return MealTemplateItem(
            food_id=food.id,
            food_name=data.food_name or food.name,
            quantity_label=data.quantity_label,
            quantity_multiplier=multiplier,
            calories=Decimal(str(food.calories)) * multiplier,
            protein_g=Decimal(str(food.protein_g)) * multiplier,
            carbs_g=Decimal(str(food.carbs_g)) * multiplier,
            fat_g=Decimal(str(food.fat_g)) * multiplier,
            order_index=order_index,
        )

    if not data.food_name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="food_name is required when food_id is not provided",
        )
    if any(
        v is None for v in (data.calories, data.protein_g, data.carbs_g, data.fat_g)
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="calories/protein_g/carbs_g/fat_g are required without food_id",
        )

    return MealTemplateItem(
        food_id=None,
        food_name=data.food_name,
        quantity_label=data.quantity_label,
        quantity_multiplier=None,
        calories=data.calories,
        protein_g=data.protein_g,
        carbs_g=data.carbs_g,
        fat_g=data.fat_g,
        order_index=order_index,
    )


def _build_items(
    db: Session, items: list[MealTemplateItemCreate]
) -> list[MealTemplateItem]:
    return [_build_item(db, item, index) for index, item in enumerate(items)]


def compute_totals(meal_template: MealTemplate) -> MacroTotals:
    calories = sum((item.calories or 0) for item in meal_template.items)
    protein_g = sum((item.protein_g or 0) for item in meal_template.items)
    carbs_g = sum((item.carbs_g or 0) for item in meal_template.items)
    fat_g = sum((item.fat_g or 0) for item in meal_template.items)
    return MacroTotals(
        calories=float(calories),
        protein_g=float(protein_g),
        carbs_g=float(carbs_g),
        fat_g=float(fat_g),
    )


def to_out(meal_template: MealTemplate) -> MealTemplateOut:
    return MealTemplateOut(
        id=meal_template.id,
        name=meal_template.name,
        notes=meal_template.notes,
        items=list(meal_template.items),
        totals=compute_totals(meal_template),
    )


def list_meal_templates(db: Session, trainer: Trainer) -> list[MealTemplate]:
    return meal_template_repository.list_meal_templates(db, trainer.id)


def get_meal_template(db: Session, meal_template_id: uuid.UUID) -> MealTemplate:
    meal_template = meal_template_repository.get_by_id(db, meal_template_id)
    if meal_template is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Meal template not found"
        )
    return meal_template


def create_meal_template(
    db: Session, trainer: Trainer, data: MealTemplateCreate
) -> MealTemplate:
    meal_template = MealTemplate(
        trainer_id=trainer.id, name=data.name, notes=data.notes
    )
    meal_template.items = _build_items(db, data.items)
    return meal_template_repository.create(db, meal_template)


def update_meal_template(
    db: Session, meal_template_id: uuid.UUID, data: MealTemplateUpdate
) -> MealTemplate:
    meal_template = get_meal_template(db, meal_template_id)
    field_updates = data.model_dump(exclude_unset=True, exclude={"items"})
    if field_updates:
        meal_template_repository.update_fields(db, meal_template, field_updates)
    if data.items is not None:
        new_items = _build_items(db, data.items)
        meal_template_repository.replace_items(db, meal_template, new_items)
    return meal_template


def delete_meal_template(db: Session, meal_template_id: uuid.UUID) -> None:
    meal_template = get_meal_template(db, meal_template_id)
    if meal_template_repository.is_in_use(db, meal_template_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete a meal template that is used by one or more menus",
        )
    meal_template_repository.delete(db, meal_template)

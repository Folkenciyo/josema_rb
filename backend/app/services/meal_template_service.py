import uuid
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import MealTemplate, MealTemplateItem, Trainer
from app.models.food import format_unit_label
from app.repositories import food_repository, meal_template_repository
from app.schemas.meal_template import (
    MacroTotals,
    MealTemplateCreate,
    MealTemplateItemCreate,
    MealTemplateOut,
    MealTemplateUpdate,
)

# Every nutrition value carried from a Food down to a meal line, in label order.
NUTRIENT_FIELDS = (
    "calories",
    "protein_g",
    "carbs_g",
    "sugars_g",
    "fat_g",
    "saturated_fat_g",
    "fiber_g",
    "salt_g",
)

# Without a Food to scale from, these must be typed by hand.
REQUIRED_MANUAL_FIELDS = ("calories", "protein_g", "carbs_g", "fat_g")


def _scaled_nutrients(food: object, multiplier: Decimal) -> dict[str, Decimal]:
    return {
        field: Decimal(str(getattr(food, field))) * multiplier
        for field in NUTRIENT_FIELDS
    }


def _build_catalog_item(
    db: Session, data: MealTemplateItemCreate, order_index: int
) -> MealTemplateItem:
    food = food_repository.get_by_id(db, data.food_id)
    if food is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Food {data.food_id} not found",
        )

    unit_amount = Decimal(str(food.unit_amount))
    if data.quantity_amount is not None:
        amount = Decimal(str(data.quantity_amount))
        multiplier = amount / unit_amount
    else:
        multiplier = Decimal(str(data.quantity_multiplier or 1))
        amount = unit_amount * multiplier

    return MealTemplateItem(
        food_id=food.id,
        food_name=data.food_name or food.name,
        quantity_amount=amount,
        quantity_unit=food.unit_type,
        quantity_label=data.quantity_label
        or format_unit_label(float(amount), food.unit_type),
        quantity_multiplier=multiplier,
        order_index=order_index,
        **_scaled_nutrients(food, multiplier),
    )


def _build_manual_item(
    data: MealTemplateItemCreate, order_index: int
) -> MealTemplateItem:
    if not data.food_name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="food_name is required when food_id is not provided",
        )
    if any(getattr(data, field) is None for field in REQUIRED_MANUAL_FIELDS):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="calories/protein_g/carbs_g/fat_g are required without food_id",
        )

    return MealTemplateItem(
        food_id=None,
        food_name=data.food_name,
        quantity_amount=data.quantity_amount,
        quantity_unit=None,
        quantity_label=data.quantity_label,
        quantity_multiplier=None,
        order_index=order_index,
        **{field: getattr(data, field) or 0 for field in NUTRIENT_FIELDS},
    )


def _build_item(
    db: Session, data: MealTemplateItemCreate, order_index: int
) -> MealTemplateItem:
    if data.food_id is not None:
        return _build_catalog_item(db, data, order_index)
    return _build_manual_item(data, order_index)


def _build_items(
    db: Session, items: list[MealTemplateItemCreate]
) -> list[MealTemplateItem]:
    return [_build_item(db, item, index) for index, item in enumerate(items)]


def compute_totals(meal_template: MealTemplate) -> MacroTotals:
    return MacroTotals(
        **{
            field: float(
                sum((getattr(item, field) or 0) for item in meal_template.items)
            )
            for field in NUTRIENT_FIELDS
        }
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

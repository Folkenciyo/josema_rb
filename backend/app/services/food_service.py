import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Food, Trainer
from app.repositories import food_repository
from app.schemas.food import FoodCreate, FoodFiltersOut, FoodUpdate


def list_foods(
    db: Session,
    trainer: Trainer,
    *,
    search: str | None = None,
    category: str | None = None,
    subcategory: str | None = None,
    min_calories: float | None = None,
    max_calories: float | None = None,
    sort: str | None = None,
) -> list[Food]:
    return food_repository.list_foods(
        db,
        trainer.id,
        search=search,
        category=category,
        subcategory=subcategory,
        min_calories=min_calories,
        max_calories=max_calories,
        sort=sort,
    )


def get_filters(db: Session, trainer: Trainer) -> FoodFiltersOut:
    return FoodFiltersOut(**food_repository.distinct_filter_values(db, trainer.id))


def get_food(db: Session, food_id: uuid.UUID) -> Food:
    food = food_repository.get_by_id(db, food_id)
    if food is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Food not found"
        )
    return food


def create_food(db: Session, trainer: Trainer, data: FoodCreate) -> Food:
    return food_repository.create(db, trainer.id, data.model_dump())


def update_food(db: Session, food_id: uuid.UUID, data: FoodUpdate) -> Food:
    food = get_food(db, food_id)
    updates = data.model_dump(exclude_unset=True)
    _check_subcomponents(food, updates)
    return food_repository.update(db, food, updates)


def _check_subcomponents(food: Food, updates: dict[str, float]) -> None:
    """Re-validate label consistency against the values a PATCH leaves in place."""
    merged = {
        field: updates.get(field, getattr(food, field))
        for field in ("carbs_g", "sugars_g", "fat_g", "saturated_fat_g")
    }
    if float(merged["sugars_g"]) > float(merged["carbs_g"]):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Los azúcares no pueden superar a los hidratos",
        )
    if float(merged["saturated_fat_g"]) > float(merged["fat_g"]):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Las grasas saturadas no pueden superar a las grasas",
        )


def delete_food(db: Session, food_id: uuid.UUID) -> None:
    food = get_food(db, food_id)
    food_repository.delete(db, food)

import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Food, Trainer
from app.repositories import food_repository
from app.schemas.food import FoodCreate, FoodUpdate


def list_foods(db: Session, trainer: Trainer) -> list[Food]:
    return food_repository.list_foods(db, trainer.id)


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
    return food_repository.update(db, food, updates)


def delete_food(db: Session, food_id: uuid.UUID) -> None:
    food = get_food(db, food_id)
    food_repository.delete(db, food)

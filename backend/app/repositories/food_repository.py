import uuid
from typing import Any

from sqlalchemy.orm import Session

from app.models import Food


def list_foods(db: Session, trainer_id: uuid.UUID) -> list[Food]:
    return (
        db.query(Food).filter(Food.trainer_id == trainer_id).order_by(Food.name).all()
    )


def get_by_id(db: Session, food_id: uuid.UUID) -> Food | None:
    return db.get(Food, food_id)


def create(db: Session, trainer_id: uuid.UUID, data: dict[str, Any]) -> Food:
    food = Food(trainer_id=trainer_id, **data)
    db.add(food)
    db.commit()
    db.refresh(food)
    return food


def update(db: Session, food: Food, data: dict[str, Any]) -> Food:
    for field, value in data.items():
        setattr(food, field, value)
    db.commit()
    db.refresh(food)
    return food


def delete(db: Session, food: Food) -> None:
    db.delete(food)
    db.commit()

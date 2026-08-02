import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import get_current_trainer
from app.models import Food, Trainer
from app.schemas.food import FoodCreate, FoodOut, FoodUpdate
from app.services import food_service

router = APIRouter(
    prefix="/api/foods", tags=["foods"], dependencies=[Depends(get_current_trainer)]
)


@router.get("", response_model=list[FoodOut])
def list_foods(
    db: Session = Depends(get_db), trainer: Trainer = Depends(get_current_trainer)
) -> list[Food]:
    return food_service.list_foods(db, trainer)


@router.post("", response_model=FoodOut, status_code=status.HTTP_201_CREATED)
def create_food(
    payload: FoodCreate,
    trainer: Trainer = Depends(get_current_trainer),
    db: Session = Depends(get_db),
) -> Food:
    return food_service.create_food(db, trainer, payload)


@router.get("/{food_id}", response_model=FoodOut)
def get_food(food_id: uuid.UUID, db: Session = Depends(get_db)) -> Food:
    return food_service.get_food(db, food_id)


@router.patch("/{food_id}", response_model=FoodOut)
def update_food(
    food_id: uuid.UUID, payload: FoodUpdate, db: Session = Depends(get_db)
) -> Food:
    return food_service.update_food(db, food_id, payload)


@router.delete("/{food_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_food(food_id: uuid.UUID, db: Session = Depends(get_db)) -> None:
    food_service.delete_food(db, food_id)

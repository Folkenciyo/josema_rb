import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import get_current_trainer
from app.models import Food, Trainer
from app.schemas.food import FoodCreate, FoodFiltersOut, FoodOut, FoodUpdate
from app.services import food_service

router = APIRouter(
    prefix="/api/foods", tags=["foods"], dependencies=[Depends(get_current_trainer)]
)


@router.get("", response_model=list[FoodOut])
def list_foods(
    search: str | None = Query(default=None),
    category: str | None = Query(default=None),
    subcategory: str | None = Query(default=None),
    min_calories: float | None = Query(default=None, ge=0),
    max_calories: float | None = Query(default=None, ge=0),
    sort: str | None = Query(default=None),
    db: Session = Depends(get_db),
    trainer: Trainer = Depends(get_current_trainer),
) -> list[Food]:
    return food_service.list_foods(
        db,
        trainer,
        search=search,
        category=category,
        subcategory=subcategory,
        min_calories=min_calories,
        max_calories=max_calories,
        sort=sort,
    )


@router.get("/filters", response_model=FoodFiltersOut)
def get_filters(
    db: Session = Depends(get_db), trainer: Trainer = Depends(get_current_trainer)
) -> FoodFiltersOut:
    return food_service.get_filters(db, trainer)


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

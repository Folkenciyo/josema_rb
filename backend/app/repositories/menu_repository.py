import uuid
from typing import Any

from sqlalchemy.orm import Session, selectinload

from app.models import DietDay, MealTemplate, Menu, MenuMeal

_DETAIL_LOADER = selectinload(Menu.meals).options(
    selectinload(MenuMeal.meal_template).selectinload(MealTemplate.items)
)


def list_menus(db: Session, trainer_id: uuid.UUID) -> list[Menu]:
    return (
        db.query(Menu)
        .options(_DETAIL_LOADER)
        .filter(Menu.trainer_id == trainer_id)
        .order_by(Menu.name)
        .all()
    )


def get_by_id(db: Session, menu_id: uuid.UUID) -> Menu | None:
    return db.query(Menu).options(_DETAIL_LOADER).filter(Menu.id == menu_id).first()


def create(db: Session, menu: Menu) -> Menu:
    db.add(menu)
    db.commit()
    db.refresh(menu)
    return menu


def update_fields(db: Session, menu: Menu, data: dict[str, Any]) -> Menu:
    for field, value in data.items():
        setattr(menu, field, value)
    db.commit()
    db.refresh(menu)
    return menu


def replace_meals(db: Session, menu: Menu, meals: list[MenuMeal]) -> Menu:
    menu.meals = meals
    db.commit()
    db.refresh(menu)
    return menu


def delete(db: Session, menu: Menu) -> None:
    db.delete(menu)
    db.commit()


def is_in_use(db: Session, menu_id: uuid.UUID) -> bool:
    return db.query(DietDay).filter(DietDay.menu_id == menu_id).first() is not None

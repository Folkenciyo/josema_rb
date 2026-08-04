import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Menu, MenuMeal, Trainer
from app.repositories import meal_template_repository, menu_repository
from app.schemas.meal_template import MacroTotals
from app.schemas.menu import (
    MenuCreate,
    MenuMealCreate,
    MenuMealOut,
    MenuOut,
    MenuUpdate,
)
from app.services import meal_template_service


def _build_menu_meal(db: Session, data: MenuMealCreate) -> MenuMeal:
    meal_template = meal_template_repository.get_by_id(db, data.meal_template_id)
    if meal_template is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meal template {data.meal_template_id} not found",
        )
    return MenuMeal(
        meal_template_id=meal_template.id,
        order_index=data.order_index,
        time_of_day=data.time_of_day,
    )


def _build_menu_meals(db: Session, meals: list[MenuMealCreate]) -> list[MenuMeal]:
    return [_build_menu_meal(db, meal) for meal in meals]


def compute_totals(menu: Menu) -> MacroTotals:
    meal_totals = [
        meal_template_service.compute_totals(menu_meal.meal_template)
        for menu_meal in menu.meals
    ]
    return MacroTotals(
        **{
            field: sum(getattr(totals, field) for totals in meal_totals)
            for field in meal_template_service.NUTRIENT_FIELDS
        }
    )


def to_out(menu: Menu) -> MenuOut:
    return MenuOut(
        id=menu.id,
        name=menu.name,
        notes=menu.notes,
        meals=[
            MenuMealOut(
                id=menu_meal.id,
                meal_template=meal_template_service.to_out(menu_meal.meal_template),
                order_index=menu_meal.order_index,
                time_of_day=menu_meal.time_of_day,
            )
            for menu_meal in menu.meals
        ],
        totals=compute_totals(menu),
    )


def list_menus(db: Session, trainer: Trainer) -> list[Menu]:
    return menu_repository.list_menus(db, trainer.id)


def get_menu(db: Session, menu_id: uuid.UUID) -> Menu:
    menu = menu_repository.get_by_id(db, menu_id)
    if menu is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Menu not found"
        )
    return menu


def create_menu(db: Session, trainer: Trainer, data: MenuCreate) -> Menu:
    menu = Menu(trainer_id=trainer.id, name=data.name, notes=data.notes)
    menu.meals = _build_menu_meals(db, data.meals)
    return menu_repository.create(db, menu)


def update_menu(db: Session, menu_id: uuid.UUID, data: MenuUpdate) -> Menu:
    menu = get_menu(db, menu_id)
    field_updates = data.model_dump(exclude_unset=True, exclude={"meals"})
    if field_updates:
        menu_repository.update_fields(db, menu, field_updates)
    if data.meals is not None:
        new_meals = _build_menu_meals(db, data.meals)
        menu_repository.replace_meals(db, menu, new_meals)
    return menu


def delete_menu(db: Session, menu_id: uuid.UUID) -> None:
    menu = get_menu(db, menu_id)
    if menu_repository.is_in_use(db, menu_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete a menu assigned to one or more diet plan days",
        )
    menu_repository.delete(db, menu)

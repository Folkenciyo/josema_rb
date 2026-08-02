import uuid
from typing import Any

from sqlalchemy.orm import Session, selectinload

from app.models import DietDay, DietPlan, DietWeek, MealTemplate, Menu, MenuMeal

_DAY_LOADER = selectinload(DietDay.menu).options(
    selectinload(Menu.meals).options(
        selectinload(MenuMeal.meal_template).selectinload(MealTemplate.items)
    )
)
_DETAIL_LOADER = selectinload(DietPlan.weeks).options(
    selectinload(DietWeek.days).options(_DAY_LOADER)
)


def list_by_client(db: Session, client_id: uuid.UUID) -> list[DietPlan]:
    return (
        db.query(DietPlan)
        .filter(DietPlan.client_id == client_id)
        .order_by(DietPlan.created_at.desc())
        .all()
    )


def get_by_id(db: Session, plan_id: uuid.UUID) -> DietPlan | None:
    return (
        db.query(DietPlan)
        .options(_DETAIL_LOADER)
        .filter(DietPlan.id == plan_id)
        .first()
    )


def create(db: Session, plan: DietPlan) -> DietPlan:
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


def update_fields(db: Session, plan: DietPlan, data: dict[str, Any]) -> DietPlan:
    for field, value in data.items():
        setattr(plan, field, value)
    db.commit()
    db.refresh(plan)
    return plan


def delete(db: Session, plan: DietPlan) -> None:
    db.delete(plan)
    db.commit()


def get_week(db: Session, week_id: uuid.UUID) -> DietWeek | None:
    return (
        db.query(DietWeek)
        .options(selectinload(DietWeek.days).options(_DAY_LOADER))
        .filter(DietWeek.id == week_id)
        .first()
    )


def add_week(db: Session, plan: DietPlan, week: DietWeek) -> DietWeek:
    plan.weeks.append(week)
    db.commit()
    db.refresh(week)
    return week


def replace_days(db: Session, week: DietWeek, days: list[DietDay]) -> DietWeek:
    week.days = days
    db.commit()
    db.refresh(week)
    return week

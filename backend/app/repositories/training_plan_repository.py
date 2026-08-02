import uuid
from typing import Any

from sqlalchemy.orm import Session, selectinload

from app.models import TrainingDay, TrainingDayExercise, TrainingPlan, TrainingWeek

_DAY_LOADER = selectinload(TrainingDay.exercises).selectinload(
    TrainingDayExercise.exercise
)
_DETAIL_LOADER = selectinload(TrainingPlan.weeks).options(
    selectinload(TrainingWeek.days).options(_DAY_LOADER)
)


def list_by_client(db: Session, client_id: uuid.UUID) -> list[TrainingPlan]:
    return (
        db.query(TrainingPlan)
        .filter(TrainingPlan.client_id == client_id)
        .order_by(TrainingPlan.created_at.desc())
        .all()
    )


def get_by_id(db: Session, plan_id: uuid.UUID) -> TrainingPlan | None:
    return (
        db.query(TrainingPlan)
        .options(_DETAIL_LOADER)
        .filter(TrainingPlan.id == plan_id)
        .first()
    )


def create(db: Session, plan: TrainingPlan) -> TrainingPlan:
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


def update_fields(
    db: Session, plan: TrainingPlan, data: dict[str, Any]
) -> TrainingPlan:
    for field, value in data.items():
        setattr(plan, field, value)
    db.commit()
    db.refresh(plan)
    return plan


def delete(db: Session, plan: TrainingPlan) -> None:
    db.delete(plan)
    db.commit()


def get_week(db: Session, week_id: uuid.UUID) -> TrainingWeek | None:
    return (
        db.query(TrainingWeek)
        .options(selectinload(TrainingWeek.days).options(_DAY_LOADER))
        .filter(TrainingWeek.id == week_id)
        .first()
    )


def add_week(db: Session, plan: TrainingPlan, week: TrainingWeek) -> TrainingWeek:
    plan.weeks.append(week)
    db.commit()
    db.refresh(week)
    return week


def replace_days(
    db: Session, week: TrainingWeek, days: list[TrainingDay]
) -> TrainingWeek:
    week.days = days
    db.commit()
    db.refresh(week)
    return week

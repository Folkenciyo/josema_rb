import uuid
from typing import Any

from sqlalchemy.orm import Session, selectinload

from app.models import TrainingDay, TrainingDayExercise, TrainingPlan, TrainingWeek
from app.models.training_plan import PlanStatus

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


def list_templates(db: Session, trainer_id: uuid.UUID) -> list[TrainingPlan]:
    """Reusable routines: the ones that belong to the trainer and to no client."""
    return (
        db.query(TrainingPlan)
        .options(_DETAIL_LOADER)
        .filter(TrainingPlan.trainer_id == trainer_id)
        .order_by(TrainingPlan.title)
        .all()
    )


def get_active_for_client(db: Session, client_id: uuid.UUID) -> TrainingPlan | None:
    """The plan the client is training right now — the newest one still active."""
    return (
        db.query(TrainingPlan)
        .options(_DETAIL_LOADER)
        .filter(
            TrainingPlan.client_id == client_id,
            TrainingPlan.status == PlanStatus.ACTIVE,
        )
        .order_by(TrainingPlan.created_at.desc())
        .first()
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


def get_day_for_client(
    db: Session, client_id: uuid.UUID, day_id: uuid.UUID
) -> TrainingDay | None:
    """A day of any plan of this client, active or not.

    A session recorded without coverage may only arrive once the trainer has
    archived the plan it belongs to, so the active plan is not enough here.
    """
    return (
        db.query(TrainingDay)
        .options(_DAY_LOADER)
        .join(TrainingWeek, TrainingDay.training_week_id == TrainingWeek.id)
        .join(TrainingPlan, TrainingWeek.training_plan_id == TrainingPlan.id)
        .filter(TrainingDay.id == day_id, TrainingPlan.client_id == client_id)
        .first()
    )


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

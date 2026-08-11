import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import (
    Client,
    PlanStatus,
    Trainer,
    TrainingDay,
    TrainingDayExercise,
    TrainingPlan,
    TrainingWeek,
)
from app.repositories import exercise_repository, training_plan_repository
from app.schemas.training_plan import (
    SetTrainingDaysRequest,
    TrainingDayExerciseIn,
    TrainingDayIn,
    TrainingPlanCreate,
    TrainingPlanUpdate,
    TrainingWeekCreate,
)


def list_plans_for_client(db: Session, client_id: uuid.UUID) -> list[TrainingPlan]:
    return training_plan_repository.list_by_client(db, client_id)


def get_plan(db: Session, plan_id: uuid.UUID) -> TrainingPlan:
    plan = training_plan_repository.get_by_id(db, plan_id)
    if plan is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Training plan not found"
        )
    return plan


def create_plan(db: Session, client: Client, data: TrainingPlanCreate) -> TrainingPlan:
    plan = TrainingPlan(client_id=client.id, **data.model_dump())
    return training_plan_repository.create(db, plan)


def _copy_day(source: TrainingDay) -> TrainingDay:
    day = TrainingDay(day_of_week=source.day_of_week, order_index=source.order_index)
    day.exercises = [
        TrainingDayExercise(
            exercise_id=exercise.exercise_id,
            order_index=exercise.order_index,
            sets=exercise.sets,
            reps=exercise.reps,
            rest_seconds=exercise.rest_seconds,
            tempo=exercise.tempo,
            superset_group=exercise.superset_group,
            notes=exercise.notes,
        )
        for exercise in source.exercises
    ]
    return day


def copy_plan(
    db: Session,
    source_plan_id: uuid.UUID,
    *,
    client_id: uuid.UUID | None = None,
    trainer_id: uuid.UUID | None = None,
    title: str | None = None,
) -> TrainingPlan:
    """Copy a whole routine — weeks, days and exercises — onto a new owner.

    The one operation behind all three cases: reusing another client's routine,
    saving one as a template, and starting a client from a template. The copy is
    always a draft with no dates: it is a starting point, not a plan already
    running, and the trainer decides when it begins.
    """
    source = get_plan(db, source_plan_id)

    copy = TrainingPlan(
        client_id=client_id,
        trainer_id=trainer_id,
        title=title or source.title,
        notes=source.notes,
        status=PlanStatus.DRAFT,
    )
    copy.weeks = [
        TrainingWeek(
            week_number=week.week_number,
            notes=week.notes,
            days=[_copy_day(day) for day in week.days],
        )
        for week in source.weeks
    ]

    return training_plan_repository.create(db, copy)


def list_templates(db: Session, trainer: Trainer) -> list[TrainingPlan]:
    return training_plan_repository.list_templates(db, trainer.id)


def create_template(
    db: Session, trainer: Trainer, data: TrainingPlanCreate
) -> TrainingPlan:
    """An empty template, filled in with the same editor a client's plan uses."""
    plan = TrainingPlan(
        trainer_id=trainer.id,
        title=data.title,
        notes=data.notes,
        status=PlanStatus.DRAFT,
    )
    return training_plan_repository.create(db, plan)


def update_plan(
    db: Session, plan_id: uuid.UUID, data: TrainingPlanUpdate
) -> TrainingPlan:
    plan = get_plan(db, plan_id)
    updates = data.model_dump(exclude_unset=True)
    return training_plan_repository.update_fields(db, plan, updates)


def delete_plan(db: Session, plan_id: uuid.UUID) -> None:
    plan = get_plan(db, plan_id)
    training_plan_repository.delete(db, plan)


def add_week(db: Session, plan_id: uuid.UUID, data: TrainingWeekCreate) -> TrainingWeek:
    plan = get_plan(db, plan_id)
    week = TrainingWeek(week_number=data.week_number, notes=data.notes)
    return training_plan_repository.add_week(db, plan, week)


def _get_week(db: Session, week_id: uuid.UUID) -> TrainingWeek:
    week = training_plan_repository.get_week(db, week_id)
    if week is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Training week not found"
        )
    return week


def _build_day_exercise(
    db: Session, ex_in: TrainingDayExerciseIn
) -> TrainingDayExercise:
    exercise = exercise_repository.get_by_id(db, ex_in.exercise_id)
    if exercise is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exercise {ex_in.exercise_id} not found",
        )
    return TrainingDayExercise(
        exercise_id=exercise.id,
        order_index=ex_in.order_index,
        sets=ex_in.sets,
        reps=ex_in.reps,
        rest_seconds=ex_in.rest_seconds,
        tempo=ex_in.tempo,
        superset_group=ex_in.superset_group,
        notes=ex_in.notes,
    )


def _build_day(db: Session, day_in: TrainingDayIn) -> TrainingDay:
    day = TrainingDay(day_of_week=day_in.day_of_week, order_index=day_in.order_index)
    day.exercises = [_build_day_exercise(db, ex) for ex in day_in.exercises]
    return day


def set_week_days(
    db: Session, week_id: uuid.UUID, data: SetTrainingDaysRequest
) -> TrainingWeek:
    week = _get_week(db, week_id)
    days = [_build_day(db, day_in) for day_in in data.days]
    return training_plan_repository.replace_days(db, week, days)


def duplicate_week(
    db: Session, week_id: uuid.UUID, new_week_number: int
) -> TrainingWeek:
    source_week = _get_week(db, week_id)
    plan = get_plan(db, source_week.training_plan_id)

    new_week = TrainingWeek(week_number=new_week_number, notes=source_week.notes)
    new_week.days = [_copy_day(day) for day in source_week.days]
    return training_plan_repository.add_week(db, plan, new_week)

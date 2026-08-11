import uuid
from datetime import UTC, date, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Client, TrainingDay, TrainingDayExercise, WorkoutSession
from app.models.workout import WorkoutSet
from app.repositories import training_plan_repository, workout_repository
from app.schemas.workout import (
    MAX_BACKDATED_DAYS,
    ExerciseHistoryOut,
    ExercisePointOut,
    LoggedSetOut,
    WorkoutDayDetailOut,
    WorkoutDayOut,
    WorkoutExerciseOut,
    WorkoutSessionCreate,
    WorkoutSessionOut,
    WorkoutSessionSummaryOut,
    WorkoutSetOut,
)
from app.services.export_service import DAY_LABELS_ES

# A phone clock can sit a few hours off, and a session finished at midnight may
# arrive dated tomorrow. Beyond a day it is not a clock, it is a wrong date.
MAX_CLOCK_DRIFT_DAYS = 1


def _no_active_plan() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND, detail="No active training plan"
    )


def _day_not_found() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND, detail="Training day not found"
    )


def _image_of(exercise: TrainingDayExercise) -> str | None:
    return exercise.exercise.images[0] if exercise.exercise.images else None


def _as_float(value: object | None) -> float | None:
    return float(value) if value is not None else None


def list_training_days(db: Session, client: Client) -> list[WorkoutDayOut]:
    """The days of the active plan, in the order they were laid out."""
    plan = training_plan_repository.get_active_for_client(db, client.id)
    if plan is None:
        raise _no_active_plan()

    last_trained = workout_repository.last_trained_per_day(db, client.id)

    return [
        WorkoutDayOut(
            id=day.id,
            week_number=week.week_number,
            day_of_week_es=DAY_LABELS_ES[day.day_of_week],
            exercise_count=len(day.exercises),
            last_performed_on=last_trained.get(day.id),
        )
        for week in plan.weeks
        for day in week.days
    ]


def _find_day_in_active_plan(
    db: Session, client: Client, day_id: uuid.UUID
) -> tuple[TrainingDay, int, str]:
    plan = training_plan_repository.get_active_for_client(db, client.id)
    if plan is None:
        raise _no_active_plan()

    for week in plan.weeks:
        for day in week.days:
            if day.id == day_id:
                return day, week.week_number, plan.title

    # Not in the active plan means it is not this client's to train: a day id
    # from someone else's routine reads exactly the same as one that was deleted.
    raise _day_not_found()


def get_training_day(
    db: Session, client: Client, day_id: uuid.UUID
) -> WorkoutDayDetailOut:
    day, week_number, plan_title = _find_day_in_active_plan(db, client, day_id)
    last_sets = workout_repository.last_sets_per_exercise(db, client.id, day.id)

    exercises = []
    for planned in day.exercises:
        performed_on, sets = last_sets.get(planned.id, (None, []))
        exercises.append(
            WorkoutExerciseOut(
                id=planned.id,
                name_es=planned.exercise.name_es,
                image_path=_image_of(planned),
                sets=planned.sets,
                reps=planned.reps,
                rest_seconds=planned.rest_seconds,
                tempo=planned.tempo,
                notes=planned.notes,
                superset_group=planned.superset_group,
                last_performed_on=performed_on,
                last_sets=[
                    LoggedSetOut(
                        set_number=performed.set_number,
                        weight_kg=_as_float(performed.weight_kg),
                        reps=performed.reps,
                    )
                    for performed in sorted(sets, key=lambda item: item.set_number)
                ],
            )
        )

    return WorkoutDayDetailOut(
        id=day.id,
        week_number=week_number,
        day_of_week_es=DAY_LABELS_ES[day.day_of_week],
        plan_title=plan_title,
        exercises=exercises,
    )


def _validate_date(performed_on: date) -> None:
    today = datetime.now(UTC).date()
    if performed_on > today + timedelta(days=MAX_CLOCK_DRIFT_DAYS):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="La fecha de la sesión no puede estar en el futuro",
        )
    if performed_on < today - timedelta(days=MAX_BACKDATED_DAYS):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="La sesión es demasiado antigua para registrarse",
        )


def _day_of_any_plan(
    db: Session, client: Client, day_id: uuid.UUID
) -> tuple[TrainingDay, str]:
    """The day this session belongs to, from any plan of this client.

    Only theirs: a day id copied from someone else's routine reads exactly the
    same as one that no longer exists.
    """
    day = training_plan_repository.get_day_for_client(db, client.id, day_id)
    if day is None:
        raise _day_not_found()
    return day, day.training_week.training_plan.title


def record_session(
    db: Session, client: Client, payload: WorkoutSessionCreate
) -> WorkoutSessionOut:
    """Store a finished session. Sending it twice returns the one already stored."""
    existing = workout_repository.get_by_device_id(
        db, client.id, payload.device_session_id
    )
    if existing is not None:
        return _to_session_out(existing)

    _validate_date(payload.performed_on)
    day, plan_title = _day_of_any_plan(db, client, payload.training_day_id)
    planned_by_id = {planned.id: planned for planned in day.exercises}

    session = WorkoutSession(
        client_id=client.id,
        training_day_id=day.id,
        device_session_id=payload.device_session_id,
        performed_on=payload.performed_on,
        day_of_week=day.day_of_week,
        plan_title=plan_title,
        notes=payload.notes,
    )

    for logged in payload.sets:
        planned = planned_by_id.get(logged.training_day_exercise_id)
        session.sets.append(
            WorkoutSet(
                # The reference is dropped when the trainer rewrote the routine
                # while the phone had no coverage; the name below still holds.
                training_day_exercise_id=planned.id if planned else None,
                exercise_id=planned.exercise_id if planned else None,
                exercise_name=logged.exercise_name,
                order_index=logged.order_index,
                set_number=logged.set_number,
                target_reps=planned.reps if planned else None,
                weight_kg=logged.weight_kg,
                reps=logged.reps,
            )
        )

    return _to_session_out(workout_repository.create(db, session))


def _to_session_out(session: WorkoutSession) -> WorkoutSessionOut:
    return WorkoutSessionOut(
        id=session.id,
        performed_on=session.performed_on,
        day_of_week_es=DAY_LABELS_ES[session.day_of_week],
        plan_title=session.plan_title,
        notes=session.notes,
        sets=[
            WorkoutSetOut(
                exercise_name=performed.exercise_name,
                order_index=performed.order_index,
                set_number=performed.set_number,
                target_reps=performed.target_reps,
                weight_kg=_as_float(performed.weight_kg),
                reps=performed.reps,
            )
            for performed in session.sets
        ],
    )


def _volume_of(session: WorkoutSession) -> float:
    return sum(
        float(performed.weight_kg) * performed.reps
        for performed in session.sets
        if performed.weight_kg is not None and performed.reps
    )


def list_sessions(
    db: Session, client: Client, *, limit: int | None = None
) -> list[WorkoutSessionSummaryOut]:
    return [
        WorkoutSessionSummaryOut(
            id=session.id,
            performed_on=session.performed_on,
            day_of_week_es=DAY_LABELS_ES[session.day_of_week],
            plan_title=session.plan_title,
            exercise_count=len({performed.order_index for performed in session.sets}),
            set_count=len(session.sets),
            total_volume_kg=round(_volume_of(session), 2),
        )
        for session in workout_repository.list_for_client(db, client.id, limit=limit)
    ]


def get_session(
    db: Session, client: Client, session_id: uuid.UUID
) -> WorkoutSessionOut:
    session = workout_repository.get_by_id(db, client.id, session_id)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
        )
    return _to_session_out(session)


def exercise_history(
    db: Session, client: Client, exercise_id: str
) -> ExerciseHistoryOut:
    """One point per day: the heaviest set, plus the volume of the whole day."""
    rows = workout_repository.list_sets_for_exercise(db, client.id, exercise_id)
    if not rows:
        return ExerciseHistoryOut(exercise_name="", points=[])

    by_day: dict[date, list[WorkoutSet]] = {}
    for performed_on, performed_set in rows:
        by_day.setdefault(performed_on, []).append(performed_set)

    points = []
    for performed_on, sets in sorted(by_day.items()):
        weighted = [item for item in sets if item.weight_kg is not None]
        top = max(weighted, key=lambda item: item.weight_kg) if weighted else None
        points.append(
            ExercisePointOut(
                performed_on=performed_on,
                top_weight_kg=_as_float(top.weight_kg) if top else None,
                top_reps=top.reps if top else None,
                total_volume_kg=round(
                    sum(
                        float(item.weight_kg) * item.reps
                        for item in sets
                        if item.weight_kg is not None and item.reps
                    ),
                    2,
                ),
            )
        )

    return ExerciseHistoryOut(exercise_name=rows[-1][1].exercise_name, points=points)

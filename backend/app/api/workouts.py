import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import get_current_trainer
from app.schemas.workout import (
    ExerciseHistoryOut,
    TrainedExerciseOut,
    TrainingCalendarOut,
    WorkoutSessionOut,
    WorkoutSessionSummaryOut,
)
from app.services import client_service, training_calendar, workout_service

router = APIRouter(tags=["workouts"], dependencies=[Depends(get_current_trainer)])


@router.get(
    "/api/clients/{client_id}/workouts",
    response_model=list[WorkoutSessionSummaryOut],
)
def list_client_workouts(
    client_id: uuid.UUID, db: Session = Depends(get_db)
) -> list[WorkoutSessionSummaryOut]:
    """What the client has actually trained, newest first."""
    client = client_service.get_client(db, client_id)
    return workout_service.list_sessions(db, client)


@router.get(
    "/api/clients/{client_id}/workouts/{session_id}",
    response_model=WorkoutSessionOut,
)
def get_client_workout(
    client_id: uuid.UUID, session_id: uuid.UUID, db: Session = Depends(get_db)
) -> WorkoutSessionOut:
    client = client_service.get_client(db, client_id)
    return workout_service.get_session(db, client, session_id)


@router.get(
    "/api/clients/{client_id}/training-calendar",
    response_model=TrainingCalendarOut,
)
def get_training_calendar(
    client_id: uuid.UUID,
    since: date = Query(..., description="First day of the range, inclusive"),
    until: date = Query(..., description="Last day of the range, inclusive"),
    db: Session = Depends(get_db),
) -> TrainingCalendarOut:
    """Which days the client trained, and which ones the routine asked for."""
    if until < since:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="The range ends before it starts",
        )
    if (until - since).days > training_calendar.MAX_RANGE_DAYS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="The range is too long",
        )

    client = client_service.get_client(db, client_id)
    return training_calendar.build_calendar(db, client, since=since, until=until)


@router.get(
    "/api/clients/{client_id}/trained-exercises",
    response_model=list[TrainedExerciseOut],
)
def list_trained_exercises(
    client_id: uuid.UUID, db: Session = Depends(get_db)
) -> list[TrainedExerciseOut]:
    """The exercises this client has logged, newest first: the ones worth charting."""
    client = client_service.get_client(db, client_id)
    return workout_service.list_trained_exercises(db, client)


@router.get(
    "/api/clients/{client_id}/exercises/{exercise_id}/history",
    response_model=ExerciseHistoryOut,
)
def get_exercise_history(
    client_id: uuid.UUID, exercise_id: str, db: Session = Depends(get_db)
) -> ExerciseHistoryOut:
    """One point per training day: the heaviest set and the volume of that day."""
    client = client_service.get_client(db, client_id)
    return workout_service.exercise_history(db, client, exercise_id)

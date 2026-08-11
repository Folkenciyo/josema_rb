import uuid
from datetime import date

from pydantic import BaseModel, Field

# A session sent from the gym may take hours to reach us, and a phone clock can
# be a day off in either direction. Anything older is someone filling in a diary.
MAX_BACKDATED_DAYS = 60
MAX_SETS_PER_SESSION = 300


class LoggedSetOut(BaseModel):
    """A set that was performed. Skipped sets are simply not there."""

    set_number: int
    weight_kg: float | None
    reps: int | None


class WorkoutExerciseOut(BaseModel):
    """An exercise as the training screen needs it: target and last time's numbers."""

    id: uuid.UUID
    name_es: str
    image_path: str | None
    sets: int
    reps: str
    rest_seconds: int | None
    tempo: str | None
    notes: str | None
    superset_group: int | None
    last_performed_on: date | None
    last_sets: list[LoggedSetOut]


class WorkoutDayOut(BaseModel):
    """A day of the routine, as offered to be trained."""

    id: uuid.UUID
    week_number: int
    day_of_week_es: str
    exercise_count: int
    last_performed_on: date | None


class WorkoutDayDetailOut(BaseModel):
    id: uuid.UUID
    week_number: int
    day_of_week_es: str
    plan_title: str
    exercises: list[WorkoutExerciseOut]


class LoggedSetIn(BaseModel):
    """One performed set, as the phone recorded it.

    `exercise_name` travels with it: it is what the client had on screen, and the
    trainer may have rewritten the routine while the phone had no coverage.
    """

    training_day_exercise_id: uuid.UUID | None = None
    exercise_name: str = Field(min_length=1, max_length=255)
    order_index: int = Field(ge=0)
    set_number: int = Field(ge=1, le=99)
    weight_kg: float | None = Field(default=None, ge=0, le=9999)
    reps: int | None = Field(default=None, ge=0, le=999)


class WorkoutSessionCreate(BaseModel):
    """A whole session, sent in one go once it is finished.

    `device_session_id` is generated on the phone so that resending — which is
    the normal outcome of training without coverage — cannot create a duplicate.
    """

    device_session_id: str = Field(min_length=8, max_length=64)
    training_day_id: uuid.UUID
    performed_on: date
    notes: str | None = Field(default=None, max_length=2000)
    sets: list[LoggedSetIn] = Field(min_length=1, max_length=MAX_SETS_PER_SESSION)


class WorkoutSetOut(LoggedSetOut):
    exercise_name: str
    order_index: int
    target_reps: str | None


class WorkoutSessionOut(BaseModel):
    """A session as it is read back, by the client and by the trainer alike."""

    id: uuid.UUID
    performed_on: date
    day_of_week_es: str
    plan_title: str | None
    notes: str | None
    sets: list[WorkoutSetOut]


class WorkoutSessionSummaryOut(BaseModel):
    """One line of history: enough to list sessions without loading every set."""

    id: uuid.UUID
    performed_on: date
    day_of_week_es: str
    plan_title: str | None
    exercise_count: int
    set_count: int
    total_volume_kg: float


class ExercisePointOut(BaseModel):
    """The heaviest set of a day, which is what a progression chart is made of."""

    performed_on: date
    top_weight_kg: float | None
    top_reps: int | None
    total_volume_kg: float


class ExerciseHistoryOut(BaseModel):
    exercise_name: str
    points: list[ExercisePointOut]


class TrainedExerciseOut(BaseModel):
    """One line per exercise the client has logged, to pick a progression from."""

    exercise_id: str
    exercise_name: str
    session_count: int
    last_performed_on: date
    best_weight_kg: float | None

import uuid
from datetime import date

from pydantic import BaseModel, model_validator

from app.models.training_plan import DayOfWeek, ExerciseMeasurement, PlanStatus


class TrainingPlanCreate(BaseModel):
    title: str
    notes: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: PlanStatus = PlanStatus.DRAFT
    # A routine written as one week and repeated all month is the usual case.
    repeats: bool = False


class CopyTrainingPlanRequest(BaseModel):
    """A copy usually wants its own name: "Fuerza de Laura" on Marta reads odd."""

    title: str | None = None


class TrainingPlanUpdate(BaseModel):
    title: str | None = None
    notes: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: PlanStatus | None = None
    repeats: bool | None = None


class TrainingPlanOut(BaseModel):
    id: uuid.UUID
    # Null on a template: it belongs to the trainer, not to a client.
    client_id: uuid.UUID | None
    title: str
    notes: str | None
    start_date: date | None
    end_date: date | None
    status: PlanStatus
    repeats: bool

    model_config = {"from_attributes": True}


class TrainingWeekCreate(BaseModel):
    week_number: int
    notes: str | None = None


class TrainingWeekOut(BaseModel):
    id: uuid.UUID
    week_number: int
    notes: str | None

    model_config = {"from_attributes": True}


class TrainingDayExerciseIn(BaseModel):
    exercise_id: str
    order_index: int
    sets: int
    measurement: ExerciseMeasurement = ExerciseMeasurement.REPS
    reps: str | None = None
    duration_seconds: int | None = None
    rest_seconds: int | None = None
    tempo: str | None = None
    superset_group: int | None = None
    notes: str | None = None
    # Only kept on the exercise that opens the block; anywhere else it is
    # dropped, so a day can never hold two notes for the same superset.
    superset_note: str | None = None

    @model_validator(mode="after")
    def check_measurement_matches_value(self) -> "TrainingDayExerciseIn":
        if self.measurement == ExerciseMeasurement.REPS:
            if not self.reps:
                raise ValueError("reps is required when measurement is reps")
            self.duration_seconds = None
        else:
            if self.duration_seconds is None or self.duration_seconds <= 0:
                raise ValueError(
                    "duration_seconds is required when measurement is time"
                )
            self.reps = None
        return self


class TrainingDayIn(BaseModel):
    day_of_week: DayOfWeek
    order_index: int
    # What the trainer wants done that day as a whole, beyond the exercises.
    notes: str | None = None
    exercises: list[TrainingDayExerciseIn] = []


class TrainingDayExerciseOut(BaseModel):
    id: uuid.UUID
    exercise_id: str
    order_index: int
    sets: int
    measurement: ExerciseMeasurement
    reps: str | None
    duration_seconds: int | None
    rest_seconds: int | None
    tempo: str | None
    superset_group: int | None
    notes: str | None
    superset_note: str | None

    model_config = {"from_attributes": True}


class TrainingDayOut(BaseModel):
    id: uuid.UUID
    day_of_week: DayOfWeek
    order_index: int
    notes: str | None
    exercises: list[TrainingDayExerciseOut]

    model_config = {"from_attributes": True}


class TrainingWeekDetailOut(TrainingWeekOut):
    days: list[TrainingDayOut]


class SetTrainingDaysRequest(BaseModel):
    days: list[TrainingDayIn]


class DuplicateWeekRequest(BaseModel):
    week_number: int


class TrainingPlanDetailOut(TrainingPlanOut):
    weeks: list[TrainingWeekDetailOut]

import uuid
from datetime import date

from pydantic import BaseModel

from app.models.training_plan import DayOfWeek, PlanStatus


class TrainingPlanCreate(BaseModel):
    title: str
    notes: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: PlanStatus = PlanStatus.DRAFT


class TrainingPlanUpdate(BaseModel):
    title: str | None = None
    notes: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: PlanStatus | None = None


class TrainingPlanOut(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    title: str
    notes: str | None
    start_date: date | None
    end_date: date | None
    status: PlanStatus

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
    reps: str
    rest_seconds: int | None = None
    tempo: str | None = None
    superset_group: int | None = None
    notes: str | None = None


class TrainingDayIn(BaseModel):
    day_of_week: DayOfWeek
    order_index: int
    exercises: list[TrainingDayExerciseIn] = []


class TrainingDayExerciseOut(BaseModel):
    id: uuid.UUID
    exercise_id: str
    order_index: int
    sets: int
    reps: str
    rest_seconds: int | None
    tempo: str | None
    superset_group: int | None
    notes: str | None

    model_config = {"from_attributes": True}


class TrainingDayOut(BaseModel):
    id: uuid.UUID
    day_of_week: DayOfWeek
    order_index: int
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

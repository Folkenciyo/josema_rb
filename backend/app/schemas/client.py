import uuid
from datetime import date, datetime

from pydantic import BaseModel


class ClientBase(BaseModel):
    full_name: str
    email: str | None = None
    phone: str | None = None
    birth_date: date | None = None
    sex: str | None = None
    height_cm: float | None = None
    goals: str | None = None
    notes: str | None = None


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    birth_date: date | None = None
    sex: str | None = None
    height_cm: float | None = None
    goals: str | None = None
    notes: str | None = None


class ClientOut(ClientBase):
    id: uuid.UUID
    active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PlanSummary(BaseModel):
    id: uuid.UUID
    title: str
    status: str
    start_date: date | None
    end_date: date | None

    model_config = {"from_attributes": True}


class ClientDetailOut(ClientOut):
    training_plans: list[PlanSummary] = []
    diet_plans: list[PlanSummary] = []

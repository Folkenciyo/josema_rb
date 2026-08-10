import uuid
from datetime import date

from pydantic import BaseModel


class ClientWithoutPlanAlert(BaseModel):
    client_id: uuid.UUID
    client_name: str
    # "training", "diet" or both, in that order.
    missing: list[str]


class ExpiringPlanAlert(BaseModel):
    client_id: uuid.UUID
    client_name: str
    plan_id: uuid.UUID
    plan_kind: str
    title: str
    end_date: date
    # Negative when the plan is already past its end date but still active.
    days_left: int


class StaleWeighInAlert(BaseModel):
    client_id: uuid.UUID
    client_name: str
    last_weighed_on: date | None
    days_since: int | None


class InactiveClientAlert(BaseModel):
    client_id: uuid.UUID
    client_name: str
    deactivated_on: date


class DashboardAlerts(BaseModel):
    clients_without_plan: list[ClientWithoutPlanAlert]
    expiring_plans: list[ExpiringPlanAlert]
    stale_weigh_ins: list[StaleWeighInAlert]
    inactive_clients: list[InactiveClientAlert]
    total: int

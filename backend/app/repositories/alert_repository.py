import uuid
from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Client, ClientMeasurement, DietPlan, TrainingPlan
from app.models.training_plan import PlanStatus

PlanModel = type[TrainingPlan] | type[DietPlan]


def list_active_clients(db: Session) -> list[Client]:
    return (
        db.query(Client)
        .filter(Client.active.is_(True))
        .order_by(Client.full_name)
        .all()
    )


def list_inactive_clients(db: Session) -> list[Client]:
    return (
        db.query(Client)
        .filter(Client.active.is_(False))
        .order_by(Client.updated_at.desc())
        .all()
    )


def client_ids_with_active_plan(db: Session, model: PlanModel) -> set[uuid.UUID]:
    rows = (
        db.query(model.client_id)
        .filter(model.status == PlanStatus.ACTIVE)
        .distinct()
        .all()
    )
    return {row[0] for row in rows}


def list_active_plans_ending_by(
    db: Session, model: PlanModel, limit_date: date
) -> list[tuple[uuid.UUID, uuid.UUID, str, str, date]]:
    """Active plans of active clients whose end date is not past `limit_date`.

    Plans already past their end date are included on purpose: an active plan
    that expired last week is exactly what the trainer needs to be reminded of.
    """
    rows = (
        db.query(
            model.id,
            model.client_id,
            Client.full_name,
            model.title,
            model.end_date,
        )
        .join(Client, Client.id == model.client_id)
        .filter(
            Client.active.is_(True),
            model.status == PlanStatus.ACTIVE,
            model.end_date.is_not(None),
            model.end_date <= limit_date,
        )
        .order_by(model.end_date)
        .all()
    )
    return [tuple(row) for row in rows]


def last_weigh_in_by_client(db: Session) -> dict[uuid.UUID, date]:
    rows = (
        db.query(
            ClientMeasurement.client_id,
            func.max(ClientMeasurement.measured_on),
        )
        .group_by(ClientMeasurement.client_id)
        .all()
    )
    return {client_id: measured_on for client_id, measured_on in rows}

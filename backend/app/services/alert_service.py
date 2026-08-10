from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.models import Client, DietPlan, TrainingPlan
from app.repositories import alert_repository
from app.repositories.alert_repository import PlanModel
from app.schemas.alert import (
    ClientWithoutPlanAlert,
    DashboardAlerts,
    ExpiringPlanAlert,
    InactiveClientAlert,
    StaleWeighInAlert,
)

# A plan is worth flagging once it ends within the week.
PLAN_EXPIRY_WINDOW_DAYS = 7
# A month without stepping on the scale is what the trainer wants to hear about.
WEIGH_IN_STALE_DAYS = 30

PLAN_KINDS: tuple[tuple[str, PlanModel], ...] = (
    ("training", TrainingPlan),
    ("diet", DietPlan),
)


def get_dashboard_alerts(db: Session, *, today: date | None = None) -> DashboardAlerts:
    reference_day = today or date.today()
    active_clients = alert_repository.list_active_clients(db)

    clients_without_plan = _clients_without_plan(db, active_clients)
    expiring_plans = _expiring_plans(db, reference_day)
    stale_weigh_ins = _stale_weigh_ins(db, active_clients, reference_day)
    inactive_clients = [
        InactiveClientAlert(
            client_id=client.id,
            client_name=client.full_name,
            deactivated_on=client.updated_at.date(),
        )
        for client in alert_repository.list_inactive_clients(db)
    ]

    return DashboardAlerts(
        clients_without_plan=clients_without_plan,
        expiring_plans=expiring_plans,
        stale_weigh_ins=stale_weigh_ins,
        inactive_clients=inactive_clients,
        total=(
            len(clients_without_plan)
            + len(expiring_plans)
            + len(stale_weigh_ins)
            + len(inactive_clients)
        ),
    )


def _clients_without_plan(
    db: Session, active_clients: list[Client]
) -> list[ClientWithoutPlanAlert]:
    covered = {
        kind: alert_repository.client_ids_with_active_plan(db, model)
        for kind, model in PLAN_KINDS
    }

    alerts = []
    for client in active_clients:
        missing = [kind for kind, _ in PLAN_KINDS if client.id not in covered[kind]]
        if missing:
            alerts.append(
                ClientWithoutPlanAlert(
                    client_id=client.id,
                    client_name=client.full_name,
                    missing=missing,
                )
            )
    return alerts


def _expiring_plans(db: Session, reference_day: date) -> list[ExpiringPlanAlert]:
    limit_date = reference_day + timedelta(days=PLAN_EXPIRY_WINDOW_DAYS)

    alerts = [
        ExpiringPlanAlert(
            client_id=client_id,
            client_name=client_name,
            plan_id=plan_id,
            plan_kind=kind,
            title=title,
            end_date=end_date,
            days_left=(end_date - reference_day).days,
        )
        for kind, model in PLAN_KINDS
        for plan_id, client_id, client_name, title, end_date in (
            alert_repository.list_active_plans_ending_by(db, model, limit_date)
        )
    ]
    return sorted(alerts, key=lambda alert: alert.end_date)


def _stale_weigh_ins(
    db: Session, active_clients: list[Client], reference_day: date
) -> list[StaleWeighInAlert]:
    last_weigh_ins = alert_repository.last_weigh_in_by_client(db)
    # Clients created less than a month ago have not had time to be weighed yet.
    newcomer_cutoff = reference_day - timedelta(days=WEIGH_IN_STALE_DAYS)

    alerts = []
    for client in active_clients:
        last_weighed_on = last_weigh_ins.get(client.id)

        if last_weighed_on is None:
            if client.created_at.date() > newcomer_cutoff:
                continue
            days_since = None
        else:
            days_since = (reference_day - last_weighed_on).days
            if days_since <= WEIGH_IN_STALE_DAYS:
                continue

        alerts.append(
            StaleWeighInAlert(
                client_id=client.id,
                client_name=client.full_name,
                last_weighed_on=last_weighed_on,
                days_since=days_since,
            )
        )
    return alerts

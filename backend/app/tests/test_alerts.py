from datetime import UTC, date, datetime, timedelta
from typing import Any

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Client

TODAY = date.today()


def _create_client(api: TestClient, name: str) -> str:
    return api.post("/api/clients", json={"full_name": name}).json()["id"]


def _add_plan(
    api: TestClient,
    client_id: str,
    kind: str,
    *,
    title: str,
    status: str,
    end_date: date | None = None,
) -> str:
    payload: dict[str, Any] = {"title": title, "status": status}
    if end_date is not None:
        payload["end_date"] = end_date.isoformat()
    response = api.post(f"/api/clients/{client_id}/{kind}-plans", json=payload)
    assert response.status_code == 201
    return response.json()["id"]


def _get_alerts(api: TestClient) -> dict[str, Any]:
    response = api.get("/api/alerts")
    assert response.status_code == 200
    return response.json()


def _row_for(
    alerts: dict[str, Any], group: str, client_id: str
) -> dict[str, Any] | None:
    return next((row for row in alerts[group] if row["client_id"] == client_id), None)


def _backdate_creation(db: Session, client_id: str, days: int) -> None:
    """Age a client so alerts that ignore brand-new clients do fire."""
    db.query(Client).filter(Client.id == client_id).update(
        {Client.created_at: datetime.now(UTC) - timedelta(days=days)}
    )
    db.flush()


def test_client_without_active_plans_reports_what_is_missing(
    authenticated_client: TestClient,
) -> None:
    without_any = _create_client(authenticated_client, "Sin Nada")
    only_training = _create_client(authenticated_client, "Solo Rutina")
    fully_covered = _create_client(authenticated_client, "Todo Al Dia")

    _add_plan(
        authenticated_client, only_training, "training", title="Fuerza", status="active"
    )
    _add_plan(
        authenticated_client, fully_covered, "training", title="Fuerza", status="active"
    )
    _add_plan(
        authenticated_client, fully_covered, "diet", title="Volumen", status="active"
    )

    alerts = _get_alerts(authenticated_client)

    assert _row_for(alerts, "clients_without_plan", without_any) == {
        "client_id": without_any,
        "client_name": "Sin Nada",
        "missing": ["training", "diet"],
    }
    row = _row_for(alerts, "clients_without_plan", only_training)
    assert row is not None and row["missing"] == ["diet"]
    assert _row_for(alerts, "clients_without_plan", fully_covered) is None


def test_draft_plans_do_not_count_as_an_active_plan(
    authenticated_client: TestClient,
) -> None:
    client_id = _create_client(authenticated_client, "Solo Borradores")
    _add_plan(
        authenticated_client, client_id, "training", title="Borrador", status="draft"
    )

    alerts = _get_alerts(authenticated_client)

    row = _row_for(alerts, "clients_without_plan", client_id)
    assert row is not None and row["missing"] == ["training", "diet"]


def test_only_active_plans_near_their_end_date_are_reported(
    authenticated_client: TestClient,
) -> None:
    client_id = _create_client(authenticated_client, "Cliente Caducidad")
    ending_soon = _add_plan(
        authenticated_client,
        client_id,
        "training",
        title="Acaba Pronto",
        status="active",
        end_date=TODAY + timedelta(days=3),
    )
    already_over = _add_plan(
        authenticated_client,
        client_id,
        "diet",
        title="Ya Vencido",
        status="active",
        end_date=TODAY - timedelta(days=2),
    )
    far_away = _add_plan(
        authenticated_client,
        client_id,
        "training",
        title="Queda Mucho",
        status="active",
        end_date=TODAY + timedelta(days=45),
    )
    draft_ending_soon = _add_plan(
        authenticated_client,
        client_id,
        "diet",
        title="Borrador Que Acaba",
        status="draft",
        end_date=TODAY + timedelta(days=1),
    )

    expiring = {
        row["plan_id"]: row
        for row in _get_alerts(authenticated_client)["expiring_plans"]
    }

    assert expiring[ending_soon]["days_left"] == 3
    assert expiring[ending_soon]["plan_kind"] == "training"
    assert expiring[ending_soon]["client_name"] == "Cliente Caducidad"
    assert expiring[already_over]["days_left"] == -2
    assert far_away not in expiring
    assert draft_ending_soon not in expiring


def test_weigh_in_alert_fires_only_after_a_month_without_measurements(
    authenticated_client: TestClient, db_session: Session
) -> None:
    stale = _create_client(authenticated_client, "Sin Pesarse")
    recent = _create_client(authenticated_client, "Recien Pesado")
    brand_new = _create_client(authenticated_client, "Cliente Nuevo")
    never_weighed = _create_client(authenticated_client, "Nunca Se Peso")
    _backdate_creation(db_session, never_weighed, days=60)

    last_weigh_in = TODAY - timedelta(days=40)
    authenticated_client.post(
        f"/api/clients/{stale}/measurements",
        json={"measured_on": last_weigh_in.isoformat(), "weight_kg": 80},
    )
    authenticated_client.post(
        f"/api/clients/{recent}/measurements",
        json={
            "measured_on": (TODAY - timedelta(days=5)).isoformat(),
            "weight_kg": 78,
        },
    )

    alerts = _get_alerts(authenticated_client)

    assert _row_for(alerts, "stale_weigh_ins", stale) == {
        "client_id": stale,
        "client_name": "Sin Pesarse",
        "last_weighed_on": last_weigh_in.isoformat(),
        "days_since": 40,
    }
    assert _row_for(alerts, "stale_weigh_ins", recent) is None
    assert _row_for(alerts, "stale_weigh_ins", brand_new) is None

    never = _row_for(alerts, "stale_weigh_ins", never_weighed)
    assert never is not None
    assert never["last_weighed_on"] is None
    assert never["days_since"] is None


def test_inactive_clients_are_listed_apart_and_excluded_elsewhere(
    authenticated_client: TestClient,
) -> None:
    client_id = _create_client(authenticated_client, "Cliente Baja")
    authenticated_client.delete(f"/api/clients/{client_id}")

    alerts = _get_alerts(authenticated_client)

    assert _row_for(alerts, "inactive_clients", client_id) is not None
    assert _row_for(alerts, "clients_without_plan", client_id) is None
    assert _row_for(alerts, "stale_weigh_ins", client_id) is None
    assert client_id not in {row["client_id"] for row in alerts["expiring_plans"]}


def test_alerts_require_authentication(client: TestClient) -> None:
    assert client.get("/api/alerts").status_code == 401

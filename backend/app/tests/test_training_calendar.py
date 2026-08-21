from collections.abc import Generator
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient

from app.api.portal import portal_limiter, workout_limiter
from app.models import Exercise

# A Monday, so the week arithmetic in the assertions is readable.
START = date(2026, 8, 3)


@pytest.fixture(autouse=True)
def clean_limiter() -> Generator[None, None, None]:
    portal_limiter.reset()
    workout_limiter.reset()
    yield
    portal_limiter.reset()
    workout_limiter.reset()


def _client_with_token(api: TestClient, name: str = "Cliente Calendario") -> tuple:
    client_id = api.post("/api/clients", json={"full_name": name}).json()["id"]
    token = api.post(f"/api/clients/{client_id}/portal-token").json()["portal_token"]
    return client_id, token


def _plan(
    api: TestClient,
    client_id: str,
    exercise_id: str,
    *,
    weeks: int = 2,
    days: tuple[str, ...] = ("monday", "wednesday"),
    start_date: str | None = START.isoformat(),
    end_date: str | None = None,
    repeats: bool = False,
) -> str:
    payload = {"title": "Plan", "status": "active", "repeats": repeats}
    if start_date is not None:
        payload["start_date"] = start_date
    if end_date is not None:
        payload["end_date"] = end_date

    plan = api.post(f"/api/clients/{client_id}/training-plans", json=payload).json()

    for number in range(1, weeks + 1):
        week = api.post(
            f"/api/training-plans/{plan['id']}/weeks", json={"week_number": number}
        ).json()
        api.put(
            f"/api/training-weeks/{week['id']}/days",
            json={
                "days": [
                    {
                        "day_of_week": day,
                        "order_index": index,
                        "exercises": [
                            {
                                "exercise_id": exercise_id,
                                "order_index": 0,
                                "sets": 3,
                                "reps": "8-12",
                            }
                        ],
                    }
                    for index, day in enumerate(days)
                ]
            },
        )
    return plan["id"]


def _train(api: TestClient, token: str, when: date, device_id: str) -> None:
    day_id = api.get(f"/api/portal/{token}/workout/days").json()[0]["id"]
    detail = api.get(f"/api/portal/{token}/workout/days/{day_id}").json()
    response = api.post(
        f"/api/portal/{token}/workouts",
        json={
            "device_session_id": device_id,
            "training_day_id": day_id,
            "performed_on": when.isoformat(),
            "sets": [
                {
                    "training_day_exercise_id": detail["exercises"][0]["id"],
                    "exercise_name": detail["exercises"][0]["name_es"],
                    "order_index": 0,
                    "set_number": 1,
                    "weight_kg": 50,
                    "reps": 10,
                }
            ],
        },
    )
    assert response.status_code == 200, response.text


def _calendar(api: TestClient, client_id: str, since: date, until: date) -> dict:
    response = api.get(
        f"/api/clients/{client_id}/training-calendar",
        params={"since": since.isoformat(), "until": until.isoformat()},
    )
    assert response.status_code == 200, response.text
    return response.json()


def test_the_routine_lands_on_real_dates(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    client_id, _ = _client_with_token(authenticated_client)
    _plan(authenticated_client, client_id, imported_exercise.id)

    body = _calendar(authenticated_client, client_id, START, START + timedelta(days=20))

    # Week 1 is the week of the start date, week 2 the next one along.
    assert [day["date"] for day in body["days"]] == [
        "2026-08-03",  # Monday, week 1
        "2026-08-05",  # Wednesday, week 1
        "2026-08-10",  # Monday, week 2
        "2026-08-12",  # Wednesday, week 2
    ]
    assert all(day["planned"] and not day["trained"] for day in body["days"])
    assert body["planned_count"] == 4
    assert body["missed_count"] == 4


def test_a_plan_starting_midweek_does_not_look_backwards(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    client_id, _ = _client_with_token(authenticated_client)
    # Starts on Tuesday: Monday of that same week was never part of the plan.
    _plan(
        authenticated_client,
        client_id,
        imported_exercise.id,
        weeks=1,
        start_date="2026-08-04",
    )

    body = _calendar(authenticated_client, client_id, START, START + timedelta(days=13))

    assert [day["date"] for day in body["days"]] == ["2026-08-05"]


def test_the_end_date_cuts_the_projection(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    client_id, _ = _client_with_token(authenticated_client)
    _plan(
        authenticated_client,
        client_id,
        imported_exercise.id,
        weeks=3,
        end_date="2026-08-10",
    )

    body = _calendar(authenticated_client, client_id, START, START + timedelta(days=30))

    assert [day["date"] for day in body["days"]] == [
        "2026-08-03",
        "2026-08-05",
        "2026-08-10",
    ]


def test_a_plan_without_a_start_date_cannot_be_placed(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    client_id, _ = _client_with_token(authenticated_client)
    _plan(authenticated_client, client_id, imported_exercise.id, start_date=None)

    body = _calendar(authenticated_client, client_id, START, START + timedelta(days=30))

    # Nothing to project, and the card is told why instead of showing an empty month.
    assert body["days"] == []
    assert body["planned_count"] == 0
    assert body["has_active_plan"] is True
    assert body["plan_starts_on"] is None


def test_a_trained_day_shows_up_even_off_plan(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    client_id, token = _client_with_token(authenticated_client)
    _plan(authenticated_client, client_id, imported_exercise.id, weeks=1)
    # A Friday: the routine only asks for Monday and Wednesday.
    _train(authenticated_client, token, date(2026, 8, 7), "device-friday")

    body = _calendar(authenticated_client, client_id, START, START + timedelta(days=13))
    friday = next(day for day in body["days"] if day["date"] == "2026-08-07")

    assert friday["trained"] is True
    assert friday["planned"] is False
    assert friday["session_id"] is not None
    assert friday["set_count"] == 1
    assert body["trained_count"] == 1


def test_training_on_a_planned_day_clears_it(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    client_id, token = _client_with_token(authenticated_client)
    _plan(authenticated_client, client_id, imported_exercise.id, weeks=1)
    _train(authenticated_client, token, date(2026, 8, 3), "device-monday")

    body = _calendar(authenticated_client, client_id, START, START + timedelta(days=13))
    monday = next(day for day in body["days"] if day["date"] == "2026-08-03")

    assert monday["trained"] and monday["planned"]
    assert body["planned_count"] == 2
    assert body["missed_count"] == 1


def test_the_range_only_counts_what_falls_inside_it(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    client_id, token = _client_with_token(authenticated_client)
    _plan(authenticated_client, client_id, imported_exercise.id, weeks=3)
    _train(authenticated_client, token, date(2026, 8, 3), "device-week-1")
    _train(authenticated_client, token, date(2026, 8, 17), "device-week-3")

    body = _calendar(
        authenticated_client, client_id, date(2026, 8, 10), date(2026, 8, 16)
    )

    assert body["trained_count"] == 0
    assert body["planned_count"] == 2
    assert [day["date"] for day in body["days"]] == ["2026-08-10", "2026-08-12"]


def test_one_week_repeated_covers_the_whole_month(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    client_id, _ = _client_with_token(authenticated_client)
    # The usual routine: a single week the client repeats over and over.
    _plan(authenticated_client, client_id, imported_exercise.id, weeks=1, repeats=True)

    body = _calendar(authenticated_client, client_id, START, date(2026, 8, 31))

    assert [day["date"] for day in body["days"]] == [
        "2026-08-03",
        "2026-08-05",
        "2026-08-10",
        "2026-08-12",
        "2026-08-17",
        "2026-08-19",
        "2026-08-24",
        "2026-08-26",
        "2026-08-31",
    ]


def test_a_repeating_plan_still_stops_at_its_end_date(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    client_id, _ = _client_with_token(authenticated_client)
    _plan(
        authenticated_client,
        client_id,
        imported_exercise.id,
        weeks=1,
        repeats=True,
        end_date="2026-08-12",
    )

    body = _calendar(authenticated_client, client_id, START, date(2026, 8, 31))

    assert [day["date"] for day in body["days"]] == [
        "2026-08-03",
        "2026-08-05",
        "2026-08-10",
        "2026-08-12",
    ]


def test_a_two_week_cycle_starts_over_in_order(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    client_id, _ = _client_with_token(authenticated_client)
    # Week 1 trains Monday, week 2 trains Friday: the third week is a Monday again.
    plan_id = api_plan_with_alternating_weeks(
        authenticated_client, client_id, imported_exercise.id
    )
    assert plan_id

    body = _calendar(authenticated_client, client_id, START, date(2026, 8, 24))

    assert [day["date"] for day in body["days"]] == [
        "2026-08-03",  # week 1, Monday
        "2026-08-14",  # week 2, Friday
        "2026-08-17",  # week 1 again, Monday
    ]


def api_plan_with_alternating_weeks(
    api: TestClient, client_id: str, exercise_id: str
) -> str:
    plan = api.post(
        f"/api/clients/{client_id}/training-plans",
        json={
            "title": "Alterno",
            "status": "active",
            "start_date": START.isoformat(),
            "end_date": "2026-08-20",
            "repeats": True,
        },
    ).json()

    for number, day_of_week in ((1, "monday"), (2, "friday")):
        week = api.post(
            f"/api/training-plans/{plan['id']}/weeks", json={"week_number": number}
        ).json()
        api.put(
            f"/api/training-weeks/{week['id']}/days",
            json={
                "days": [
                    {
                        "day_of_week": day_of_week,
                        "order_index": 0,
                        "exercises": [
                            {
                                "exercise_id": exercise_id,
                                "order_index": 0,
                                "sets": 3,
                                "reps": "8-12",
                            }
                        ],
                    }
                ]
            },
        )
    return plan["id"]


def test_days_still_to_come_are_not_missed_days(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    client_id, _ = _client_with_token(authenticated_client)
    # A plan starting today: everything it asks for from tomorrow on is future.
    today = date.today()
    _plan(
        authenticated_client,
        client_id,
        imported_exercise.id,
        weeks=4,
        days=(
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
        ),
        start_date=today.isoformat(),
    )

    body = _calendar(authenticated_client, client_id, today, today + timedelta(days=20))

    assert body["planned_count"] == 21
    # Not one of them has been missed yet: today is not over and the rest is future.
    assert body["missed_count"] == 0


def test_an_upside_down_range_is_refused(authenticated_client: TestClient) -> None:
    client_id, _ = _client_with_token(authenticated_client)

    response = authenticated_client.get(
        f"/api/clients/{client_id}/training-calendar",
        params={"since": "2026-08-31", "until": "2026-08-01"},
    )

    assert response.status_code == 422


def test_the_calendar_needs_a_session(client: TestClient) -> None:
    response = client.get(
        "/api/clients/00000000-0000-0000-0000-000000000000/training-calendar",
        params={"since": "2026-08-01", "until": "2026-08-31"},
    )

    assert response.status_code == 401

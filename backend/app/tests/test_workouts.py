from collections.abc import Generator
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient

from app.api.portal import portal_limiter, workout_limiter
from app.models import Exercise


@pytest.fixture(autouse=True)
def clean_limiter() -> Generator[None, None, None]:
    """The limiter lives in process, so one test must not spend another's quota."""
    portal_limiter.reset()
    workout_limiter.reset()
    yield
    portal_limiter.reset()
    workout_limiter.reset()


def _client_with_token(api: TestClient, name: str = "Cliente Entreno") -> str:
    client_id = api.post("/api/clients", json={"full_name": name}).json()["id"]
    return api.post(f"/api/clients/{client_id}/portal-token").json()["portal_token"]


def _plan_with_one_day(
    api: TestClient, client_id: str, exercise_id: str, title: str = "Plan"
) -> None:
    plan = api.post(
        f"/api/clients/{client_id}/training-plans",
        json={"title": title, "status": "active"},
    ).json()
    week = api.post(
        f"/api/training-plans/{plan['id']}/weeks", json={"week_number": 1}
    ).json()
    api.put(
        f"/api/training-weeks/{week['id']}/days",
        json={
            "days": [
                {
                    "day_of_week": "monday",
                    "order_index": 0,
                    "exercises": [
                        {
                            "exercise_id": exercise_id,
                            "order_index": 0,
                            "sets": 3,
                            "reps": "8-12",
                            "rest_seconds": 90,
                        }
                    ],
                }
            ]
        },
    )


def _new_client_with_plan(
    api: TestClient, exercise_id: str, name: str = "Cliente Entreno"
) -> tuple[str, str]:
    client_id = api.post("/api/clients", json={"full_name": name}).json()["id"]
    token = api.post(f"/api/clients/{client_id}/portal-token").json()["portal_token"]
    _plan_with_one_day(api, client_id, exercise_id)
    return client_id, token


def _day_of(api: TestClient, token: str) -> dict:
    days = api.get(f"/api/portal/{token}/workout/days")
    assert days.status_code == 200
    return days.json()[0]


def _session_payload(day_id: str, device_id: str = "device-session-1") -> dict:
    return {
        "device_session_id": device_id,
        "training_day_id": day_id,
        "performed_on": date.today().isoformat(),
        "sets": [
            {
                "exercise_name": "Press banca",
                "order_index": 0,
                "set_number": 1,
                "weight_kg": 60,
                "reps": 10,
            },
            {
                "exercise_name": "Press banca",
                "order_index": 0,
                "set_number": 2,
                "weight_kg": 62.5,
                "reps": 8,
            },
        ],
    }


def test_the_client_sees_the_days_of_their_routine(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    _, token = _new_client_with_plan(authenticated_client, imported_exercise.id)

    day = _day_of(authenticated_client, token)

    assert day["day_of_week_es"] == "Lunes"
    assert day["exercise_count"] == 1
    assert day["last_performed_on"] is None


def test_the_training_screen_carries_the_target_of_each_exercise(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    _, token = _new_client_with_plan(authenticated_client, imported_exercise.id)
    day_id = _day_of(authenticated_client, token)["id"]

    body = authenticated_client.get(f"/api/portal/{token}/workout/days/{day_id}").json()

    exercise = body["exercises"][0]
    assert exercise["sets"] == 3
    assert exercise["reps"] == "8-12"
    assert exercise["rest_seconds"] == 90
    assert exercise["name_es"]
    assert exercise["last_sets"] == []


def test_a_recorded_session_comes_back_set_by_set(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    _, token = _new_client_with_plan(authenticated_client, imported_exercise.id)
    day = _day_of(authenticated_client, token)
    payload = _session_payload(day["id"])
    payload["sets"][0]["training_day_exercise_id"] = authenticated_client.get(
        f"/api/portal/{token}/workout/days/{day['id']}"
    ).json()["exercises"][0]["id"]

    response = authenticated_client.post(f"/api/portal/{token}/workouts", json=payload)

    assert response.status_code == 200
    body = response.json()
    assert body["day_of_week_es"] == "Lunes"
    assert [performed["weight_kg"] for performed in body["sets"]] == [60.0, 62.5]
    # The target is copied in from the plan, so rewriting the routine cannot
    # rewrite what the client was asked to do that day.
    assert body["sets"][0]["target_reps"] == "8-12"


def test_sending_the_same_session_twice_does_not_duplicate_it(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    _, token = _new_client_with_plan(authenticated_client, imported_exercise.id)
    day_id = _day_of(authenticated_client, token)["id"]
    payload = _session_payload(day_id)

    first = authenticated_client.post(f"/api/portal/{token}/workouts", json=payload)
    second = authenticated_client.post(f"/api/portal/{token}/workouts", json=payload)

    assert first.json()["id"] == second.json()["id"]
    assert len(authenticated_client.get(f"/api/portal/{token}/workouts").json()) == 1


def test_last_time_numbers_show_up_on_the_next_visit(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    _, token = _new_client_with_plan(authenticated_client, imported_exercise.id)
    day_id = _day_of(authenticated_client, token)["id"]
    detail = authenticated_client.get(
        f"/api/portal/{token}/workout/days/{day_id}"
    ).json()
    payload = _session_payload(day_id)
    for performed in payload["sets"]:
        performed["training_day_exercise_id"] = detail["exercises"][0]["id"]
    authenticated_client.post(f"/api/portal/{token}/workouts", json=payload)

    revisited = authenticated_client.get(
        f"/api/portal/{token}/workout/days/{day_id}"
    ).json()

    exercise = revisited["exercises"][0]
    assert exercise["last_performed_on"] == date.today().isoformat()
    assert [item["weight_kg"] for item in exercise["last_sets"]] == [60.0, 62.5]


def test_the_history_counts_the_volume_of_each_session(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    _, token = _new_client_with_plan(authenticated_client, imported_exercise.id)
    day_id = _day_of(authenticated_client, token)["id"]
    authenticated_client.post(
        f"/api/portal/{token}/workouts", json=_session_payload(day_id)
    )

    history = authenticated_client.get(f"/api/portal/{token}/workouts").json()

    assert history[0]["set_count"] == 2
    assert history[0]["exercise_count"] == 1
    # 60 x 10 + 62.5 x 8
    assert history[0]["total_volume_kg"] == 1100.0


def test_a_token_cannot_record_against_another_clients_routine(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    _, my_token = _new_client_with_plan(
        authenticated_client, imported_exercise.id, "Cliente Propio"
    )
    _, other_token = _new_client_with_plan(
        authenticated_client, imported_exercise.id, "Cliente Ajeno"
    )
    other_day_id = _day_of(authenticated_client, other_token)["id"]

    response = authenticated_client.post(
        f"/api/portal/{my_token}/workouts", json=_session_payload(other_day_id)
    )

    assert response.status_code == 404


def test_a_token_cannot_open_another_clients_training_day(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    _, my_token = _new_client_with_plan(
        authenticated_client, imported_exercise.id, "Cliente Propio"
    )
    _, other_token = _new_client_with_plan(
        authenticated_client, imported_exercise.id, "Cliente Ajeno"
    )
    other_day_id = _day_of(authenticated_client, other_token)["id"]

    response = authenticated_client.get(
        f"/api/portal/{my_token}/workout/days/{other_day_id}"
    )

    assert response.status_code == 404


def test_a_session_dated_in_the_future_is_refused(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    _, token = _new_client_with_plan(authenticated_client, imported_exercise.id)
    day_id = _day_of(authenticated_client, token)["id"]
    payload = _session_payload(day_id)
    payload["performed_on"] = (date.today() + timedelta(days=5)).isoformat()

    response = authenticated_client.post(f"/api/portal/{token}/workouts", json=payload)

    assert response.status_code == 422


def test_a_session_that_arrives_a_day_late_is_accepted(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    """Training without coverage on Saturday and syncing on Sunday is the point."""
    _, token = _new_client_with_plan(authenticated_client, imported_exercise.id)
    day_id = _day_of(authenticated_client, token)["id"]
    payload = _session_payload(day_id)
    payload["performed_on"] = (date.today() - timedelta(days=1)).isoformat()

    response = authenticated_client.post(f"/api/portal/{token}/workouts", json=payload)

    assert response.status_code == 200
    assert response.json()["performed_on"] == payload["performed_on"]


def test_an_empty_session_is_not_worth_storing(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    _, token = _new_client_with_plan(authenticated_client, imported_exercise.id)
    day_id = _day_of(authenticated_client, token)["id"]
    payload = _session_payload(day_id)
    payload["sets"] = []

    response = authenticated_client.post(f"/api/portal/{token}/workouts", json=payload)

    assert response.status_code == 422


def test_the_days_list_says_when_each_one_was_last_trained(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    _, token = _new_client_with_plan(authenticated_client, imported_exercise.id)
    day_id = _day_of(authenticated_client, token)["id"]
    authenticated_client.post(
        f"/api/portal/{token}/workouts", json=_session_payload(day_id)
    )

    day = _day_of(authenticated_client, token)

    assert day["last_performed_on"] == date.today().isoformat()


def test_without_an_active_plan_there_is_nothing_to_train(
    authenticated_client: TestClient,
) -> None:
    token = _client_with_token(authenticated_client, "Cliente Sin Plan")

    assert (
        authenticated_client.get(f"/api/portal/{token}/workout/days").status_code == 404
    )


def test_the_trainer_sees_what_the_client_trained(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    client_id, token = _new_client_with_plan(authenticated_client, imported_exercise.id)
    day_id = _day_of(authenticated_client, token)["id"]
    authenticated_client.post(
        f"/api/portal/{token}/workouts", json=_session_payload(day_id)
    )

    sessions = authenticated_client.get(f"/api/clients/{client_id}/workouts").json()
    detail = authenticated_client.get(
        f"/api/clients/{client_id}/workouts/{sessions[0]['id']}"
    ).json()

    assert sessions[0]["day_of_week_es"] == "Lunes"
    assert len(detail["sets"]) == 2


def test_the_progression_of_an_exercise_takes_the_heaviest_set_of_each_day(
    authenticated_client: TestClient, imported_exercise: Exercise
) -> None:
    client_id, token = _new_client_with_plan(authenticated_client, imported_exercise.id)
    day = _day_of(authenticated_client, token)
    planned_id = authenticated_client.get(
        f"/api/portal/{token}/workout/days/{day['id']}"
    ).json()["exercises"][0]["id"]
    payload = _session_payload(day["id"])
    for performed in payload["sets"]:
        performed["training_day_exercise_id"] = planned_id
    authenticated_client.post(f"/api/portal/{token}/workouts", json=payload)

    history = authenticated_client.get(
        f"/api/clients/{client_id}/exercises/{imported_exercise.id}/history"
    ).json()

    assert len(history["points"]) == 1
    assert history["points"][0]["top_weight_kg"] == 62.5
    assert history["points"][0]["total_volume_kg"] == 1100.0


def test_sessions_are_not_readable_without_a_session_cookie(
    authenticated_client: TestClient, client: TestClient, imported_exercise: Exercise
) -> None:
    client_id, _ = _new_client_with_plan(authenticated_client, imported_exercise.id)

    client.cookies.clear()

    assert client.get(f"/api/clients/{client_id}/workouts").status_code == 401

from fastapi.testclient import TestClient

QUESTIONS = {
    "questions": [
        {"text": "¿Has entrenado antes?", "kind": "yes_no", "required": True},
        {
            "text": "¿Tienes alguna lesión?",
            "kind": "long_text",
            "help_text": "Cuéntame cuándo fue y si sigue molestando.",
        },
        {
            "text": "¿Cuántos días puedes entrenar?",
            "kind": "choice",
            "options": ["2", "3", "4", "5 o más"],
            "required": True,
        },
    ]
}


# The five file fields the portal now asks for above the trainer's questions.
PROFILE = {
    "email": "elena@example.com",
    "phone": "+34 600 111 222",
    "birth_date": "1990-05-02",
    "sex": "female",
    "height_cm": 168,
}


def _client_with_token(api: TestClient, name: str = "Cliente Cuestionario") -> str:
    client_id = api.post("/api/clients", json={"full_name": name}).json()["id"]
    return api.post(f"/api/clients/{client_id}/portal-token").json()["portal_token"]


def _set_questions(api: TestClient) -> list[dict]:
    response = api.put("/api/settings/questionnaire", json=QUESTIONS)
    assert response.status_code == 200
    return response.json()["questions"]


def test_the_trainer_writes_the_questions_and_their_order(
    authenticated_client: TestClient,
) -> None:
    stored = _set_questions(authenticated_client)

    assert [question["text"] for question in stored] == [
        "¿Has entrenado antes?",
        "¿Tienes alguna lesión?",
        "¿Cuántos días puedes entrenar?",
    ]
    assert [question["order_index"] for question in stored] == [0, 1, 2]
    assert stored[2]["options"] == ["2", "3", "4", "5 o más"]


def test_saving_again_replaces_the_whole_questionnaire(
    authenticated_client: TestClient,
) -> None:
    _set_questions(authenticated_client)

    stored = authenticated_client.put(
        "/api/settings/questionnaire",
        json={"questions": [{"text": "¿Alergias?", "kind": "short_text"}]},
    ).json()["questions"]

    assert len(stored) == 1
    assert stored[0]["text"] == "¿Alergias?"


def test_a_choice_question_without_options_is_refused(
    authenticated_client: TestClient,
) -> None:
    response = authenticated_client.put(
        "/api/settings/questionnaire",
        json={"questions": [{"text": "¿Cuántos días?", "kind": "choice"}]},
    )

    assert response.status_code == 422


def test_the_client_sees_the_questionnaire_and_answers_it(
    authenticated_client: TestClient, client: TestClient
) -> None:
    questions = _set_questions(authenticated_client)
    token = _client_with_token(authenticated_client, "Elena Cuestionario")

    client.cookies.clear()
    blank = client.get(f"/api/portal/{token}/questionnaire").json()
    assert [question["text"] for question in blank["questions"]] == [
        question["text"] for question in questions
    ]
    assert blank["completed_at"] is None

    filled = client.put(
        f"/api/portal/{token}/questionnaire",
        json={
            "answers": [
                {"question_id": questions[0]["id"], "answer": "Sí"},
                {"question_id": questions[1]["id"], "answer": "Hombro izquierdo"},
                {"question_id": questions[2]["id"], "answer": "4"},
            ],
            "profile": PROFILE,
        },
    )

    assert filled.status_code == 200
    body = filled.json()
    assert [question["answer"] for question in body["questions"]] == [
        "Sí",
        "Hombro izquierdo",
        "4",
    ]
    assert body["completed_at"] is not None


def test_a_required_question_cannot_be_left_blank(
    authenticated_client: TestClient,
) -> None:
    questions = _set_questions(authenticated_client)
    token = _client_with_token(authenticated_client)

    response = authenticated_client.put(
        f"/api/portal/{token}/questionnaire",
        json={
            "answers": [{"question_id": questions[1]["id"], "answer": "Ninguna"}],
            "profile": PROFILE,
        },
    )

    assert response.status_code == 422
    assert "¿Has entrenado antes?" in response.json()["detail"]


def test_answering_a_question_that_no_longer_exists_is_a_conflict(
    authenticated_client: TestClient,
) -> None:
    questions = _set_questions(authenticated_client)
    token = _client_with_token(authenticated_client)
    stale_id = questions[0]["id"]

    authenticated_client.put(
        "/api/settings/questionnaire",
        json={"questions": [{"text": "¿Alergias?", "kind": "short_text"}]},
    )
    response = authenticated_client.put(
        f"/api/portal/{token}/questionnaire",
        json={
            "answers": [{"question_id": stale_id, "answer": "Sí"}],
            "profile": PROFILE,
        },
    )

    assert response.status_code == 409


def test_the_trainer_reads_the_answers_with_the_question_as_it_was_asked(
    authenticated_client: TestClient,
) -> None:
    questions = _set_questions(authenticated_client)
    client_id = authenticated_client.post(
        "/api/clients", json={"full_name": "Ruben Respuestas"}
    ).json()["id"]
    token = authenticated_client.post(f"/api/clients/{client_id}/portal-token").json()[
        "portal_token"
    ]

    authenticated_client.put(
        f"/api/portal/{token}/questionnaire",
        json={
            "answers": [
                {"question_id": questions[0]["id"], "answer": "No"},
                {"question_id": questions[2]["id"], "answer": "3"},
            ],
            "profile": PROFILE,
        },
    )
    # The trainer rewrites the questionnaire afterwards.
    authenticated_client.put(
        "/api/settings/questionnaire",
        json={"questions": [{"text": "¿Fumas?", "kind": "yes_no"}]},
    )

    view = authenticated_client.get(f"/api/clients/{client_id}/questionnaire").json()

    texts = [answer["question_text"] for answer in view["answers"]]
    assert "¿Has entrenado antes?" in texts
    assert view["answers"][0]["answer"] == "No"
    # The link to the live question is gone, the wording survived.
    assert view["answers"][0]["question_id"] is None


def test_the_questionnaire_of_the_portal_needs_no_session(
    authenticated_client: TestClient, client: TestClient
) -> None:
    _set_questions(authenticated_client)
    token = _client_with_token(authenticated_client)

    client.cookies.clear()
    assert client.get(f"/api/portal/{token}/questionnaire").status_code == 200


INTRO = "Bienvenido.\n\nEstas preguntas me ayudan a **no lesionarte**."


def test_the_trainer_writes_an_introduction(
    authenticated_client: TestClient,
) -> None:
    saved = authenticated_client.put(
        "/api/settings/questionnaire", json={**QUESTIONS, "intro": INTRO}
    ).json()

    assert saved["intro"] == INTRO
    # And it is still there when the editor is loaded again.
    assert authenticated_client.get("/api/settings/questionnaire").json()["intro"] == (
        INTRO
    )


def test_the_client_reads_the_introduction_above_the_questions(
    authenticated_client: TestClient,
) -> None:
    authenticated_client.put(
        "/api/settings/questionnaire", json={**QUESTIONS, "intro": INTRO}
    )
    token = _client_with_token(authenticated_client)

    view = authenticated_client.get(f"/api/portal/{token}/questionnaire").json()

    assert view["intro"] == INTRO
    assert len(view["questions"]) == 3


def test_the_introduction_survives_a_rewrite_of_the_questions(
    authenticated_client: TestClient,
) -> None:
    authenticated_client.put(
        "/api/settings/questionnaire", json={**QUESTIONS, "intro": INTRO}
    )

    # Saving without touching the intro must not wipe it: the editor always
    # sends both, but a blank one is what clears it.
    saved = authenticated_client.put(
        "/api/settings/questionnaire",
        json={
            "questions": [{"text": "¿Alergias?", "kind": "short_text"}],
            "intro": INTRO,
        },
    ).json()

    assert saved["intro"] == INTRO


def test_a_blank_introduction_clears_it(authenticated_client: TestClient) -> None:
    authenticated_client.put(
        "/api/settings/questionnaire", json={**QUESTIONS, "intro": INTRO}
    )

    saved = authenticated_client.put(
        "/api/settings/questionnaire", json={**QUESTIONS, "intro": "   "}
    ).json()

    assert saved["intro"] is None


def test_a_questionnaire_without_introduction_says_so(
    authenticated_client: TestClient,
) -> None:
    _set_questions(authenticated_client)
    token = _client_with_token(authenticated_client)

    view = authenticated_client.get(f"/api/portal/{token}/questionnaire").json()

    assert view["intro"] is None


def test_editing_the_questionnaire_requires_a_session(client: TestClient) -> None:
    client.cookies.clear()

    assert client.get("/api/settings/questionnaire").status_code == 401
    assert client.put("/api/settings/questionnaire", json=QUESTIONS).status_code == 401


def _client_and_token(api: TestClient, name: str = "Marta Ficha") -> tuple[str, str]:
    client_id = api.post("/api/clients", json={"full_name": name}).json()["id"]
    token = api.post(f"/api/clients/{client_id}/portal-token").json()["portal_token"]
    return client_id, token


def test_the_client_fills_in_their_own_file_from_the_questionnaire(
    authenticated_client: TestClient,
) -> None:
    _set_questions(authenticated_client)
    client_id, token = _client_and_token(authenticated_client)
    questions = authenticated_client.get(f"/api/portal/{token}/questionnaire").json()[
        "questions"
    ]

    authenticated_client.put(
        f"/api/portal/{token}/questionnaire",
        json={
            "answers": [
                {"question_id": questions[0]["id"], "answer": "Sí"},
                {"question_id": questions[2]["id"], "answer": "3"},
            ],
            "profile": PROFILE,
        },
    )

    file = authenticated_client.get(f"/api/clients/{client_id}").json()
    assert file["email"] == "elena@example.com"
    assert file["phone"] == "+34 600 111 222"
    assert file["birth_date"] == "1990-05-02"
    assert file["sex"] == "female"
    assert file["height_cm"] == 168


def test_the_form_opens_with_what_the_trainer_already_knew(
    authenticated_client: TestClient,
) -> None:
    client_id = authenticated_client.post(
        "/api/clients", json={"full_name": "Luis Ficha", "phone": "600111222"}
    ).json()["id"]
    token = authenticated_client.post(f"/api/clients/{client_id}/portal-token").json()[
        "portal_token"
    ]

    view = authenticated_client.get(f"/api/portal/{token}/questionnaire").json()

    assert view["profile"]["phone"] == "600111222"
    assert view["profile"]["height_cm"] is None


def test_the_questionnaire_is_not_saved_with_the_file_fields_blank(
    authenticated_client: TestClient,
) -> None:
    questions = _set_questions(authenticated_client)
    client_id, token = _client_and_token(authenticated_client)

    response = authenticated_client.put(
        f"/api/portal/{token}/questionnaire",
        json={
            "answers": [
                {"question_id": question["id"], "answer": "Sí"}
                for question in questions
            ],
            "profile": {**PROFILE, "height_cm": None, "sex": ""},
        },
    )

    assert response.status_code == 422
    assert "Altura" in response.json()["detail"]
    assert "Sexo" in response.json()["detail"]
    # And the answers did not go in behind the refusal.
    view = authenticated_client.get(f"/api/clients/{client_id}/questionnaire").json()
    assert view["answers"] == []


def test_a_file_field_that_makes_no_sense_is_refused(
    authenticated_client: TestClient,
) -> None:
    _, token = _client_and_token(authenticated_client)

    for wrong, expected in (
        ({"email": "elena.example.com"}, "email"),
        ({"phone": "600"}, "teléfono"),
        ({"birth_date": "2025-01-01"}, "nacimiento"),
        ({"height_cm": 16.8}, "altura"),
    ):
        response = authenticated_client.put(
            f"/api/portal/{token}/questionnaire",
            json={"answers": [], "profile": {**PROFILE, **wrong}},
        )

        assert response.status_code == 422, wrong
        assert expected in response.json()["detail"].lower(), wrong

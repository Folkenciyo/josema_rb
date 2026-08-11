from fastapi.testclient import TestClient

from app.services import invite_service

CUSTOM_WHATSAPP = "Buenas {nombre}! Tu acceso: {enlace} — cualquier duda me dices"


def _client_with_token(api: TestClient, name: str) -> tuple[str, str]:
    client_id = api.post("/api/clients", json={"full_name": name}).json()["id"]
    token = api.post(f"/api/clients/{client_id}/portal-token").json()["portal_token"]
    return client_id, token


def test_templates_start_as_the_stock_text(authenticated_client: TestClient) -> None:
    body = authenticated_client.get("/api/settings/invite-templates").json()

    assert body["whatsapp_template"] == invite_service.DEFAULT_WHATSAPP_TEMPLATE
    assert body["email_subject"] == invite_service.DEFAULT_EMAIL_SUBJECT
    assert "nombre" in body["placeholders"]
    assert "enlace" in body["placeholders"]


def test_the_saved_template_is_what_gets_sent(
    authenticated_client: TestClient,
) -> None:
    client_id, token = _client_with_token(authenticated_client, "Lucia Ejemplo")

    authenticated_client.put(
        "/api/settings/invite-templates",
        json={"whatsapp_template": CUSTOM_WHATSAPP},
    )
    invite = authenticated_client.get(
        f"/api/clients/{client_id}/portal-invite",
        headers={"origin": "https://josema.example.com"},
    ).json()

    assert invite["whatsapp_text"] == (
        f"Buenas Lucia! Tu acceso: https://josema.example.com/p/{token} "
        "— cualquier duda me dices"
    )
    # The email keeps its own wording: the two channels are edited apart.
    assert invite["body"].startswith("Hola Lucia:")


def test_clearing_a_template_brings_the_stock_text_back(
    authenticated_client: TestClient,
) -> None:
    authenticated_client.put(
        "/api/settings/invite-templates",
        json={"whatsapp_template": CUSTOM_WHATSAPP},
    )

    restored = authenticated_client.put(
        "/api/settings/invite-templates", json={"whatsapp_template": "   "}
    ).json()

    assert restored["whatsapp_template"] == invite_service.DEFAULT_WHATSAPP_TEMPLATE


def test_a_stray_brace_is_text_and_not_a_crash(
    authenticated_client: TestClient,
) -> None:
    client_id, _ = _client_with_token(authenticated_client, "Pedro Llaves")
    authenticated_client.put(
        "/api/settings/invite-templates",
        json={"whatsapp_template": "Hola {nombre} {esto_no_existe} {enlace} 100% {"},
    )

    invite = authenticated_client.get(f"/api/clients/{client_id}/portal-invite").json()

    assert invite["whatsapp_text"].startswith("Hola Pedro {esto_no_existe} http")
    assert invite["whatsapp_text"].endswith("100% {")


def test_templates_need_a_session(client: TestClient) -> None:
    client.cookies.clear()

    assert client.get("/api/settings/invite-templates").status_code == 401
    assert client.put("/api/settings/invite-templates", json={}).status_code == 401

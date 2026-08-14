import io
import uuid
from datetime import date

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from PIL import Image

from app.api.portal import portal_limiter
from app.models import QuoteMedia
from app.services.quote_media import parse_media_url
from app.services.quote_rotation import pick_for_day


@pytest.fixture(autouse=True)
def clean_limiter():
    """The portal limiter lives in process; one test must not spend another's."""
    portal_limiter.reset()
    yield
    portal_limiter.reset()


@pytest.fixture()
def portal_client(authenticated_client: TestClient) -> tuple[str, str]:
    """A client with a live portal link: returns its id and its token."""
    client_id = authenticated_client.post(
        "/api/clients", json={"full_name": "Cliente Motivado"}
    ).json()["id"]
    token = authenticated_client.post(f"/api/clients/{client_id}/portal-token").json()[
        "portal_token"
    ]
    return client_id, token


def _png_bytes() -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", (60, 40), (139, 30, 36)).save(buffer, format="PNG")
    return buffer.getvalue()


@pytest.mark.parametrize(
    "url,expected",
    [
        ("https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"),
        ("https://youtube.com/shorts/dQw4w9WgXcQ?feature=share", "dQw4w9WgXcQ"),
        ("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s", "dQw4w9WgXcQ"),
        ("https://youtu.be/dQw4w9WgXcQ", "dQw4w9WgXcQ"),
        ("https://m.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"),
    ],
)
def test_parse_media_url_reads_every_youtube_shape(url: str, expected: str) -> None:
    kind, reference = parse_media_url(url)

    assert kind == QuoteMedia.YOUTUBE
    assert reference == expected


@pytest.mark.parametrize(
    "url,expected",
    [
        ("https://www.instagram.com/reel/C8QltIDNQY5/", "C8QltIDNQY5"),
        ("https://instagram.com/reels/C8QltIDNQY5", "C8QltIDNQY5"),
        ("https://www.instagram.com/josemarb/reel/C8QltIDNQY5/", "C8QltIDNQY5"),
        ("https://www.instagram.com/p/C8QltIDNQY5/?img_index=1", "C8QltIDNQY5"),
    ],
)
def test_parse_media_url_reads_instagram_reels_and_posts(
    url: str, expected: str
) -> None:
    kind, reference = parse_media_url(url)

    assert kind == QuoteMedia.INSTAGRAM
    assert reference == expected


@pytest.mark.parametrize(
    "url",
    [
        "https://vimeo.com/123456789",
        "javascript:alert(1)",
        "https://www.youtube.com/shorts/short",
        "not a url at all",
        "https://www.youtube.com/",
    ],
)
def test_parse_media_url_rejects_anything_else(url: str) -> None:
    with pytest.raises(HTTPException) as error:
        parse_media_url(url)

    assert error.value.status_code == 422


def test_rotation_is_stable_within_a_day_and_moves_on_the_next() -> None:
    quotes = [uuid.uuid4() for _ in range(5)]
    client = uuid.uuid4()

    today = date(2026, 8, 14)
    assert pick_for_day(quotes, client, today) == pick_for_day(quotes, client, today)
    assert pick_for_day(quotes, client, today) != pick_for_day(
        quotes, client, date(2026, 8, 15)
    )


def test_rotation_spreads_clients_across_the_library() -> None:
    quotes = [uuid.uuid4() for _ in range(4)]
    today = date(2026, 8, 14)

    picked = {pick_for_day(quotes, uuid.uuid4(), today) for _ in range(60)}

    # With 60 clients over 4 messages, all four should come up.
    assert len(picked) == len(quotes)


def test_rotation_of_an_empty_library_is_none() -> None:
    assert pick_for_day([], uuid.uuid4(), date(2026, 8, 14)) is None


def test_create_quote_with_a_youtube_link(authenticated_client: TestClient) -> None:
    response = authenticated_client.post(
        "/api/quotes",
        data={
            "text": "El dolor es temporal, el orgullo es para siempre.",
            "author": "Lance Armstrong",
            "media_url": "https://www.youtube.com/shorts/dQw4w9WgXcQ",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["media_kind"] == "youtube"
    assert body["embed_url"] == ("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ")
    assert body["image_url"] is None


def test_create_quote_with_an_image(authenticated_client: TestClient) -> None:
    response = authenticated_client.post(
        "/api/quotes",
        data={"text": "Un día más."},
        files={"image": ("motivacion.png", _png_bytes(), "image/png")},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["media_kind"] == "image"
    assert body["image_url"].startswith("/static/quote-images/")
    assert body["embed_url"] is None


def test_create_quote_without_media_is_text_only(
    authenticated_client: TestClient,
) -> None:
    response = authenticated_client.post(
        "/api/quotes", data={"text": "Hoy tampoco te rindes."}
    )

    assert response.status_code == 201
    assert response.json()["media_kind"] == "none"


def test_create_quote_rejects_an_empty_message(
    authenticated_client: TestClient,
) -> None:
    response = authenticated_client.post("/api/quotes", data={"text": "   "})

    assert response.status_code == 422


def test_create_quote_rejects_image_and_link_together(
    authenticated_client: TestClient,
) -> None:
    response = authenticated_client.post(
        "/api/quotes",
        data={
            "text": "Dos medios",
            "media_url": "https://youtu.be/dQw4w9WgXcQ",
        },
        files={"image": ("m.png", _png_bytes(), "image/png")},
    )

    assert response.status_code == 422


def test_update_quote_can_clear_its_media(
    authenticated_client: TestClient,
) -> None:
    created = authenticated_client.post(
        "/api/quotes",
        data={
            "text": "Con vídeo",
            "media_url": "https://youtu.be/dQw4w9WgXcQ",
        },
    ).json()

    response = authenticated_client.patch(
        f"/api/quotes/{created['id']}", data={"clear_media": "true"}
    )

    assert response.status_code == 200
    assert response.json()["media_kind"] == "none"
    assert response.json()["embed_url"] is None


def test_portal_home_carries_a_quote(
    authenticated_client: TestClient, portal_client: tuple[str, str]
) -> None:
    _, token = portal_client
    authenticated_client.post("/api/quotes", data={"text": "Sigue así."})

    response = authenticated_client.get(f"/api/portal/{token}")

    assert response.status_code == 200
    assert response.json()["quote"]["text"] == "Sigue así."


def test_pinned_quote_beats_the_rotation(
    authenticated_client: TestClient, portal_client: tuple[str, str]
) -> None:
    client_id, token = portal_client
    for index in range(4):
        authenticated_client.post("/api/quotes", data={"text": f"Mensaje {index}"})
    pinned = authenticated_client.post(
        "/api/quotes", data={"text": "El elegido a mano"}
    ).json()

    authenticated_client.put(
        f"/api/quotes/pinned/{client_id}", json={"quote_id": pinned["id"]}
    )
    response = authenticated_client.get(f"/api/portal/{token}")

    assert response.json()["quote"]["text"] == "El elegido a mano"


def test_releasing_a_pin_returns_the_client_to_the_rotation(
    authenticated_client: TestClient, portal_client: tuple[str, str]
) -> None:
    client_id, _ = portal_client
    pinned = authenticated_client.post("/api/quotes", data={"text": "Fijado"}).json()
    authenticated_client.put(
        f"/api/quotes/pinned/{client_id}", json={"quote_id": pinned["id"]}
    )

    response = authenticated_client.put(
        f"/api/quotes/pinned/{client_id}", json={"quote_id": None}
    )

    assert response.status_code == 200
    assert response.json()["pinned_quote"] is None


def test_deleting_a_pinned_quote_leaves_the_client_on_the_rotation(
    authenticated_client: TestClient, portal_client: tuple[str, str]
) -> None:
    client_id, token = portal_client
    pinned = authenticated_client.post(
        "/api/quotes", data={"text": "Se va a borrar"}
    ).json()
    authenticated_client.put(
        f"/api/quotes/pinned/{client_id}", json={"quote_id": pinned["id"]}
    )

    authenticated_client.delete(f"/api/quotes/{pinned['id']}")
    response = authenticated_client.get(f"/api/portal/{token}")

    assert response.status_code == 200
    assert response.json()["quote"] is None


def test_the_portal_needs_no_session_to_read_its_quote(
    authenticated_client: TestClient,
    client: TestClient,
    portal_client: tuple[str, str],
) -> None:
    _, token = portal_client
    authenticated_client.post("/api/quotes", data={"text": "Para el cliente"})

    client.cookies.clear()
    response = client.get(f"/api/portal/{token}")

    assert response.status_code == 200
    assert response.json()["quote"]["text"] == "Para el cliente"

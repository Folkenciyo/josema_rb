import io

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.services import photo_storage


def _jpeg_bytes(width: int = 3000, height: int = 2000) -> bytes:
    image = Image.new("RGB", (width, height), color=(120, 90, 60))
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=95)
    return buffer.getvalue()


def _create_client(api: TestClient) -> str:
    response = api.post("/api/clients", json={"full_name": "Cliente de Prueba"})
    assert response.status_code == 201
    return response.json()["id"]


def _upload(
    api: TestClient,
    client_id: str,
    *,
    taken_on: str = "2026-08-01",
    pose: str = "front",
    content: bytes | None = None,
    content_type: str = "image/jpeg",
):
    return api.post(
        f"/api/clients/{client_id}/photos",
        data={"taken_on": taken_on, "pose": pose},
        files={"file": ("photo.jpg", content or _jpeg_bytes(), content_type)},
    )


def test_photo_is_stored_and_listed(authenticated_client: TestClient) -> None:
    client_id = _create_client(authenticated_client)

    response = _upload(authenticated_client, client_id)

    assert response.status_code == 201
    body = response.json()
    assert body["pose"] == "front"
    assert body["taken_on"] == "2026-08-01"

    listing = authenticated_client.get(f"/api/clients/{client_id}/photos")
    assert [p["id"] for p in listing.json()] == [body["id"]]

    authenticated_client.delete(f"/api/photos/{body['id']}")


def test_large_photo_is_resized_and_thumbnailed(
    authenticated_client: TestClient,
) -> None:
    client_id = _create_client(authenticated_client)
    photo_id = _upload(authenticated_client, client_id).json()["id"]

    full = authenticated_client.get(f"/api/photos/{photo_id}/file")
    thumb = authenticated_client.get(f"/api/photos/{photo_id}/file?thumbnail=true")

    assert full.status_code == 200
    assert max(Image.open(io.BytesIO(full.content)).size) == photo_storage.FULL_MAX_SIDE
    assert (
        max(Image.open(io.BytesIO(thumb.content)).size) == photo_storage.THUMB_MAX_SIDE
    )
    # A 3000x2000 JPEG weighs megabytes; the stored one must not.
    assert len(full.content) < 1_000_000
    assert len(thumb.content) < len(full.content)

    authenticated_client.delete(f"/api/photos/{photo_id}")


def test_exif_metadata_including_gps_is_stripped(
    authenticated_client: TestClient,
) -> None:
    exif = Image.Exif()
    exif[0x010F] = "TestPhone"  # Make
    exif[0x8825] = {1: "N", 2: (40.0, 25.0, 0.0)}  # GPSInfo: where it was taken
    image = Image.new("RGB", (800, 600), color=(10, 20, 30))
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", exif=exif)
    assert Image.open(io.BytesIO(buffer.getvalue())).getexif(), "fixture has no EXIF"

    client_id = _create_client(authenticated_client)
    photo_id = _upload(
        authenticated_client, client_id, content=buffer.getvalue()
    ).json()["id"]

    stored = authenticated_client.get(f"/api/photos/{photo_id}/file")

    assert Image.open(io.BytesIO(stored.content)).getexif() == {}

    authenticated_client.delete(f"/api/photos/{photo_id}")


def test_same_day_and_pose_replaces_the_previous_photo(
    authenticated_client: TestClient,
) -> None:
    client_id = _create_client(authenticated_client)
    first = _upload(authenticated_client, client_id).json()

    second = _upload(authenticated_client, client_id)

    assert second.status_code == 201
    assert second.json()["id"] != first["id"]

    listing = authenticated_client.get(f"/api/clients/{client_id}/photos").json()
    assert len(listing) == 1
    gone = authenticated_client.get(f"/api/photos/{first['id']}/file")
    assert gone.status_code == 404

    authenticated_client.delete(f"/api/photos/{second.json()['id']}")


def test_the_three_poses_coexist_on_the_same_day(
    authenticated_client: TestClient,
) -> None:
    client_id = _create_client(authenticated_client)

    for pose in ("front", "side", "back"):
        assert _upload(authenticated_client, client_id, pose=pose).status_code == 201

    listing = authenticated_client.get(f"/api/clients/{client_id}/photos").json()

    assert sorted(p["pose"] for p in listing) == ["back", "front", "side"]

    for photo in listing:
        authenticated_client.delete(f"/api/photos/{photo['id']}")


def test_photos_are_listed_newest_first(authenticated_client: TestClient) -> None:
    client_id = _create_client(authenticated_client)
    for taken_on in ("2025-05-01", "2026-05-01", "2025-11-01"):
        _upload(authenticated_client, client_id, taken_on=taken_on)

    listing = authenticated_client.get(f"/api/clients/{client_id}/photos").json()

    assert [p["taken_on"] for p in listing] == [
        "2026-05-01",
        "2025-11-01",
        "2025-05-01",
    ]

    for photo in listing:
        authenticated_client.delete(f"/api/photos/{photo['id']}")


def test_deleting_a_photo_removes_its_files(
    authenticated_client: TestClient,
) -> None:
    client_id = _create_client(authenticated_client)
    photo = _upload(authenticated_client, client_id).json()
    stored = photo_storage.MEDIA_ROOT / str(client_id)

    response = authenticated_client.delete(f"/api/photos/{photo['id']}")

    assert response.status_code == 204
    assert list(stored.glob(f"{photo['id']}*")) == []


def test_a_pdf_is_not_accepted_as_a_photo(
    authenticated_client: TestClient,
) -> None:
    client_id = _create_client(authenticated_client)

    response = _upload(
        authenticated_client,
        client_id,
        content=b"%PDF-1.7 not an image",
        content_type="application/pdf",
    )

    assert response.status_code == 422


def test_a_corrupt_image_is_rejected(authenticated_client: TestClient) -> None:
    client_id = _create_client(authenticated_client)

    response = _upload(
        authenticated_client, client_id, content=b"definitely not a jpeg"
    )

    assert response.status_code == 422


def test_photos_require_a_session(client: TestClient) -> None:
    response = client.get(
        "/api/clients/00000000-0000-0000-0000-000000000000/photos"
    )

    assert response.status_code == 401


@pytest.mark.parametrize("relative", ["../../secret.txt", "/etc/passwd"])
def test_stored_paths_cannot_escape_the_media_root(relative: str) -> None:
    from fastapi import HTTPException

    with pytest.raises(HTTPException):
        photo_storage.absolute_path(relative)

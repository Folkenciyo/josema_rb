import io
from datetime import date

import pytest
from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy.orm import Session

from app.models import ClientMeasurement
from app.schemas.export import ProgressDocument, ProgressRow, ProgressSide
from app.services.pdf_export import _env
from app.services.progress_service import (
    build_progress_document,
    nearest_measurement,
)


def _measurement(measured_on: str, weight: float) -> ClientMeasurement:
    return ClientMeasurement(
        measured_on=date.fromisoformat(measured_on), weight_kg=weight
    )


def _jpeg() -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", (900, 1200), color=(90, 110, 130)).save(buffer, format="JPEG")
    return buffer.getvalue()


def _client_with_two_sessions(api: TestClient) -> str:
    client_id = api.post(
        "/api/clients", json={"full_name": "Cliente de Prueba", "height_cm": 180}
    ).json()["id"]

    for taken_on, poses in (
        ("2025-05-01", ("front", "side", "back")),
        ("2026-05-01", ("front", "back")),
    ):
        for pose in poses:
            api.post(
                f"/api/clients/{client_id}/photos",
                data={"taken_on": taken_on, "pose": pose},
                files={"file": ("p.jpg", _jpeg(), "image/jpeg")},
            )

    for measured_on, weight in (("2025-05-02", 84), ("2026-04-28", 78)):
        api.post(
            f"/api/clients/{client_id}/measurements",
            json={"measured_on": measured_on, "weight_kg": weight},
        )

    return client_id


def _cleanup(api: TestClient, client_id: str) -> None:
    for photo in api.get(f"/api/clients/{client_id}/photos").json():
        api.delete(f"/api/photos/{photo['id']}")


def _progress_document(*, weighed: bool = True) -> ProgressDocument:
    return ProgressDocument(
        client_name="Ana Torres",
        before=ProgressSide(
            taken_on=date(2026, 1, 10),
            weight_kg=78.4 if weighed else None,
            weight_measured_on=date(2026, 1, 9) if weighed else None,
            bmi=25.6 if weighed else None,
        ),
        after=ProgressSide(
            taken_on=date(2026, 6, 10),
            weight_kg=72.1 if weighed else None,
            weight_measured_on=date(2026, 6, 10) if weighed else None,
            bmi=23.5 if weighed else None,
        ),
        weight_delta_kg=-6.3 if weighed else None,
        rows=[
            ProgressRow(pose_label_es="Frontal", before_image="a.jpg", after_image=None)
        ],
    )


def _render_progress_html(document: ProgressDocument) -> str:
    return _env.get_template("progress.html").render(
        doc=document, brand="file:///brand"
    )


def test_progress_template_wears_the_brand() -> None:
    html = _render_progress_html(_progress_document())

    # All three come from _base.html: the template is on the shared skin, not on
    # a stylesheet of its own.
    assert "file:///brand/logo-wordmark.png" in html
    assert "file:///brand/document-header.png" in html
    assert "Montserrat" in html

    assert "Diferencia de peso" in html
    assert "6,3 kg" in html
    # The nearest weigh-in is a day off the photo, and the document says so.
    assert "pesaje del 09/01/2026" in html


def test_progress_template_without_weigh_ins() -> None:
    html = _render_progress_html(_progress_document(weighed=False))

    assert "Diferencia de peso" not in html
    assert html.count("sin pesajes registrados") == 2


def test_nearest_measurement_picks_the_closest_weigh_in() -> None:
    measurements = [
        _measurement("2026-05-10", 78),
        _measurement("2026-04-01", 80),
        _measurement("2025-05-02", 84),
    ]

    assert nearest_measurement(measurements, date(2026, 5, 1)).measured_on == date(
        2026, 5, 10
    )
    assert nearest_measurement(measurements, date(2025, 5, 1)).measured_on == date(
        2025, 5, 2
    )


def test_nearest_measurement_prefers_the_earlier_one_on_a_tie() -> None:
    measurements = [_measurement("2026-05-11", 79), _measurement("2026-05-09", 81)]

    nearest = nearest_measurement(measurements, date(2026, 5, 10))

    assert nearest.measured_on == date(2026, 5, 9)


def test_nearest_measurement_without_weigh_ins() -> None:
    assert nearest_measurement([], date(2026, 5, 1)) is None


def test_the_document_compares_the_zones_that_were_measured(
    authenticated_client: TestClient, db_session: Session
) -> None:
    client_id = _client_with_two_sessions(authenticated_client)
    for measured_on, waist in (("2025-05-01", 96), ("2026-05-01", 88.5)):
        authenticated_client.post(
            f"/api/clients/{client_id}/body-measurements",
            json={"measured_on": measured_on, "waist_cm": waist},
        )

    document = build_progress_document(db_session, client_id)

    waist_row = next(zone for zone in document.zones if zone.label_es == "Cintura")
    assert waist_row.before_cm == 96
    assert waist_row.after_cm == 88.5
    assert waist_row.delta_cm == -7.5
    # The eight spots nobody measured stay out of the table.
    assert len(document.zones) == 1

    _cleanup(authenticated_client, client_id)


def test_a_single_set_of_readings_states_the_numbers_without_a_difference(
    authenticated_client: TestClient, db_session: Session
) -> None:
    client_id = _client_with_two_sessions(authenticated_client)
    authenticated_client.post(
        f"/api/clients/{client_id}/body-measurements",
        json={"measured_on": "2026-05-01", "waist_cm": 88.5},
    )

    document = build_progress_document(db_session, client_id)

    # Both ends resolve to the same entry: there is nothing to compare.
    assert document.zones[0].delta_cm is None

    _cleanup(authenticated_client, client_id)


def test_progress_docx_pairs_both_dates(authenticated_client: TestClient) -> None:
    client_id = _client_with_two_sessions(authenticated_client)

    response = authenticated_client.get(
        f"/api/clients/{client_id}/progress/export/docx"
    )

    assert response.status_code == 200
    assert response.content[:2] == b"PK"
    # Three poses x two dates, minus the side shot missing in 2026.
    assert len(response.content) > 10_000

    _cleanup(authenticated_client, client_id)


def test_progress_export_needs_two_dates(authenticated_client: TestClient) -> None:
    client_id = authenticated_client.post(
        "/api/clients", json={"full_name": "Cliente de Prueba"}
    ).json()["id"]
    authenticated_client.post(
        f"/api/clients/{client_id}/photos",
        data={"taken_on": "2026-05-01", "pose": "front"},
        files={"file": ("p.jpg", _jpeg(), "image/jpeg")},
    )

    response = authenticated_client.get(
        f"/api/clients/{client_id}/progress/export/docx"
    )

    assert response.status_code == 422

    _cleanup(authenticated_client, client_id)


def test_explicit_dates_are_honoured(authenticated_client: TestClient) -> None:
    client_id = _client_with_two_sessions(authenticated_client)

    response = authenticated_client.get(
        f"/api/clients/{client_id}/progress/export/docx",
        params={"before": "2025-05-01", "after": "2026-05-01"},
    )

    assert response.status_code == 200

    _cleanup(authenticated_client, client_id)


def test_progress_pdf_renders(authenticated_client: TestClient) -> None:
    client_id = _client_with_two_sessions(authenticated_client)

    try:
        response = authenticated_client.get(
            f"/api/clients/{client_id}/progress/export/pdf"
        )
    except OSError as exc:  # pragma: no cover - depends on the machine
        _cleanup(authenticated_client, client_id)
        pytest.skip(f"WeasyPrint native libraries unavailable: {exc}")

    assert response.status_code == 200
    assert response.content[:4] == b"%PDF"

    _cleanup(authenticated_client, client_id)

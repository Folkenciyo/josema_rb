import io
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.rate_limit import SlidingWindowLimiter
from app.models import Client, Trainer
from app.schemas.export import DietPlanDocument, TrainingPlanDocument
from app.schemas.portal import (
    PortalBodyMeasurementCreate,
    PortalBodyMeasurementOut,
    PortalClientOut,
    PortalPhotoOut,
    PortalWeighInCreate,
    PortalWeighInOut,
)
from app.schemas.questionnaire import PortalQuestionnaireOut, SubmitAnswersRequest
from app.schemas.workout import (
    ExerciseHistoryOut,
    TrainedExerciseOut,
    WorkoutDayDetailOut,
    WorkoutDayOut,
    WorkoutSessionCreate,
    WorkoutSessionOut,
    WorkoutSessionSummaryOut,
)
from app.services import (
    docx_export,
    export_service,
    pdf_export,
    photo_service,
    portal_service,
    questionnaire_service,
    workout_service,
)

DOCX_MEDIA_TYPE = (
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
)

# Guessing a 32-byte token is hopeless anyway; this is defence in depth against
# someone hammering the endpoint. Only failed attempts count, so a client
# reloading their own portal all day is never locked out.
portal_limiter = SlidingWindowLimiter(max_attempts=20, window_seconds=300)
# Writes are capped per link, not per IP: correcting today's weight a few times
# is normal, a script hammering the endpoint is not.
weigh_in_limiter = SlidingWindowLimiter(max_attempts=20, window_seconds=3600)
# Sessions get a looser cap: an offline phone retries the same session until it
# lands, and being locked out would lose a workout that is already done.
workout_limiter = SlidingWindowLimiter(max_attempts=60, window_seconds=3600)

router = APIRouter(prefix="/api/portal", tags=["portal"])


def _caller_ip(request: Request) -> str:
    # Traefik and the Next proxy sit in front, so the original address only
    # survives in the forwarding header.
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def get_portal_client(
    token: str, request: Request, db: Session = Depends(get_db)
) -> Client:
    """Resolve the client from the token alone.

    Every portal route depends on this and none of them takes a client id, so
    there is no way to ask for someone else's data by editing the URL.
    """
    caller = _caller_ip(request)
    if portal_limiter.is_blocked(caller):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many attempts, try again later",
        )

    try:
        return portal_service.resolve_token(db, token)
    except HTTPException:
        portal_limiter.record_attempt(caller)
        raise


def _trainer_of(db: Session, client: Client) -> Trainer:
    """The questionnaire belongs to the trainer, reached through the client."""
    return db.query(Trainer).filter(Trainer.id == client.trainer_id).one()


def _download(content: bytes, *, media_type: str, filename: str) -> StreamingResponse:
    return StreamingResponse(
        io.BytesIO(content),
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{token}", response_model=PortalClientOut)
def get_portal_home(
    client: Client = Depends(get_portal_client), db: Session = Depends(get_db)
) -> PortalClientOut:
    return portal_service.build_portal_view(db, client)


@router.get("/{token}/training-plan", response_model=TrainingPlanDocument)
def get_portal_training_plan(
    client: Client = Depends(get_portal_client), db: Session = Depends(get_db)
) -> TrainingPlanDocument:
    """The same document the PDF is built from: exercise names and images included,
    no internal ids, and no need for the client to reach the exercise catalogue."""
    plan = portal_service.get_active_training_plan(db, client)
    return export_service.build_training_plan_document(db, plan.id)


@router.get("/{token}/diet-plan", response_model=DietPlanDocument)
def get_portal_diet_plan(
    client: Client = Depends(get_portal_client), db: Session = Depends(get_db)
) -> DietPlanDocument:
    plan = portal_service.get_active_diet_plan(db, client)
    return export_service.build_diet_plan_document(db, plan.id)


@router.get("/{token}/measurements", response_model=list[PortalWeighInOut])
def list_portal_measurements(
    client: Client = Depends(get_portal_client), db: Session = Depends(get_db)
) -> list[PortalWeighInOut]:
    return portal_service.list_weigh_ins(db, client)


@router.post("/{token}/measurements", response_model=PortalWeighInOut)
def record_portal_weigh_in(
    token: str,
    payload: PortalWeighInCreate,
    client: Client = Depends(get_portal_client),
    db: Session = Depends(get_db),
) -> PortalWeighInOut:
    """The single write the portal allows, and always on today's date."""
    if weigh_in_limiter.is_blocked(token):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many entries, try again later",
        )
    weigh_in_limiter.record_attempt(token)

    return portal_service.record_weigh_in(db, client, payload.weight_kg, payload.notes)


@router.get("/{token}/body-measurements", response_model=list[PortalBodyMeasurementOut])
def list_portal_body_measurements(
    client: Client = Depends(get_portal_client), db: Session = Depends(get_db)
) -> list[PortalBodyMeasurementOut]:
    return portal_service.list_body_measurements(db, client)


@router.post("/{token}/body-measurements", response_model=PortalBodyMeasurementOut)
def record_portal_body_measurement(
    token: str,
    payload: PortalBodyMeasurementCreate,
    client: Client = Depends(get_portal_client),
    db: Session = Depends(get_db),
) -> PortalBodyMeasurementOut:
    """Today's tape readings, zone by zone and always on today's date."""
    if weigh_in_limiter.is_blocked(token):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many entries, try again later",
        )
    weigh_in_limiter.record_attempt(token)

    return portal_service.record_body_measurement(db, client, payload)


@router.post("/{token}/photo-consent", response_model=PortalClientOut)
def grant_photo_consent(
    client: Client = Depends(get_portal_client), db: Session = Depends(get_db)
) -> PortalClientOut:
    """The client agrees to their progress photos being kept, dated by the server."""
    portal_service.grant_photo_consent(db, client)
    return portal_service.build_portal_view(db, client)


@router.delete("/{token}/photo-consent", response_model=PortalClientOut)
def withdraw_photo_consent(
    client: Client = Depends(get_portal_client), db: Session = Depends(get_db)
) -> PortalClientOut:
    """Stops new photos being kept. Deleting the existing ones is asked separately."""
    portal_service.withdraw_photo_consent(db, client)
    return portal_service.build_portal_view(db, client)


@router.delete("/{token}/photos", response_model=PortalClientOut)
def delete_own_photos(
    token: str,
    client: Client = Depends(get_portal_client),
    db: Session = Depends(get_db),
) -> PortalClientOut:
    """Every photo of this client, files included. There is no undo, by design."""
    if weigh_in_limiter.is_blocked(token):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many entries, try again later",
        )
    weigh_in_limiter.record_attempt(token)

    photo_service.delete_all_photos(db, client.id)
    return portal_service.build_portal_view(db, client)


@router.get("/{token}/photos", response_model=list[PortalPhotoOut])
def list_own_photos(
    client: Client = Depends(get_portal_client), db: Session = Depends(get_db)
) -> list[PortalPhotoOut]:
    """The client's own gallery, only while the permission stands."""
    return portal_service.list_photos(db, client)


@router.get("/{token}/photos/{photo_id}/file")
def get_own_photo_file(
    photo_id: uuid.UUID,
    thumbnail: bool = False,
    client: Client = Depends(get_portal_client),
    db: Session = Depends(get_db),
) -> FileResponse:
    """Body photos through the token, never through the trainer's endpoint."""
    path = portal_service.photo_file(db, client, photo_id, thumbnail=thumbnail)
    return FileResponse(
        path,
        media_type="image/jpeg",
        headers={"Cache-Control": "private, max-age=3600"},
    )


@router.get("/{token}/trained-exercises", response_model=list[TrainedExerciseOut])
def list_own_trained_exercises(
    client: Client = Depends(get_portal_client), db: Session = Depends(get_db)
) -> list[TrainedExerciseOut]:
    """The exercises this client has logged: the ones with a chart worth showing."""
    return workout_service.list_trained_exercises(db, client)


@router.get(
    "/{token}/exercises/{exercise_id}/history", response_model=ExerciseHistoryOut
)
def get_own_exercise_history(
    exercise_id: str,
    client: Client = Depends(get_portal_client),
    db: Session = Depends(get_db),
) -> ExerciseHistoryOut:
    """One point per training day: the heaviest set and that day's volume."""
    return workout_service.exercise_history(db, client, exercise_id)


@router.get("/{token}/questionnaire", response_model=PortalQuestionnaireOut)
def get_portal_questionnaire(
    client: Client = Depends(get_portal_client), db: Session = Depends(get_db)
) -> PortalQuestionnaireOut:
    return questionnaire_service.build_portal_view(db, _trainer_of(db, client), client)


@router.put("/{token}/questionnaire", response_model=PortalQuestionnaireOut)
def submit_portal_questionnaire(
    token: str,
    payload: SubmitAnswersRequest,
    client: Client = Depends(get_portal_client),
    db: Session = Depends(get_db),
) -> PortalQuestionnaireOut:
    """The other thing the client may write, besides today's weight."""
    if weigh_in_limiter.is_blocked(token):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many entries, try again later",
        )
    weigh_in_limiter.record_attempt(token)

    return questionnaire_service.submit_answers(
        db, _trainer_of(db, client), client, payload.answers, payload.profile
    )


@router.get("/{token}/workout/days", response_model=list[WorkoutDayOut])
def list_portal_workout_days(
    client: Client = Depends(get_portal_client), db: Session = Depends(get_db)
) -> list[WorkoutDayOut]:
    """The days of the active routine, each with the date it was last trained."""
    return workout_service.list_training_days(db, client)


@router.get("/{token}/workout/days/{day_id}", response_model=WorkoutDayDetailOut)
def get_portal_workout_day(
    day_id: uuid.UUID,
    client: Client = Depends(get_portal_client),
    db: Session = Depends(get_db),
) -> WorkoutDayDetailOut:
    """Everything the training screen needs, last time's numbers included."""
    return workout_service.get_training_day(db, client, day_id)


@router.get("/{token}/workouts", response_model=list[WorkoutSessionSummaryOut])
def list_portal_workouts(
    client: Client = Depends(get_portal_client), db: Session = Depends(get_db)
) -> list[WorkoutSessionSummaryOut]:
    return workout_service.list_sessions(db, client)


@router.post("/{token}/workouts", response_model=WorkoutSessionOut)
def record_portal_workout(
    token: str,
    payload: WorkoutSessionCreate,
    client: Client = Depends(get_portal_client),
    db: Session = Depends(get_db),
) -> WorkoutSessionOut:
    """A finished session, sent in one go.

    The cap is looser than the one on weigh-ins: a phone that trained without
    coverage keeps resending until it is acknowledged, and those retries are
    harmless because the session id makes them idempotent.
    """
    if workout_limiter.is_blocked(token):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many entries, try again later",
        )
    workout_limiter.record_attempt(token)

    return workout_service.record_session(db, client, payload)


@router.get("/{token}/training-plan/export/pdf")
def export_portal_training_plan_pdf(
    client: Client = Depends(get_portal_client), db: Session = Depends(get_db)
) -> StreamingResponse:
    plan = portal_service.get_active_training_plan(db, client)
    document = export_service.build_training_plan_document(db, plan.id)
    return _download(
        pdf_export.render_training_plan_pdf(document),
        media_type="application/pdf",
        filename="mi-rutina.pdf",
    )


@router.get("/{token}/training-plan/export/docx")
def export_portal_training_plan_docx(
    client: Client = Depends(get_portal_client), db: Session = Depends(get_db)
) -> StreamingResponse:
    plan = portal_service.get_active_training_plan(db, client)
    document = export_service.build_training_plan_document(db, plan.id)
    return _download(
        docx_export.render_training_plan_docx(document),
        media_type=DOCX_MEDIA_TYPE,
        filename="mi-rutina.docx",
    )


@router.get("/{token}/diet-plan/export/pdf")
def export_portal_diet_plan_pdf(
    client: Client = Depends(get_portal_client), db: Session = Depends(get_db)
) -> StreamingResponse:
    plan = portal_service.get_active_diet_plan(db, client)
    document = export_service.build_diet_plan_document(db, plan.id)
    return _download(
        pdf_export.render_diet_plan_pdf(document),
        media_type="application/pdf",
        filename="mi-dieta.pdf",
    )


@router.get("/{token}/diet-plan/export/docx")
def export_portal_diet_plan_docx(
    client: Client = Depends(get_portal_client), db: Session = Depends(get_db)
) -> StreamingResponse:
    plan = portal_service.get_active_diet_plan(db, client)
    document = export_service.build_diet_plan_document(db, plan.id)
    return _download(
        docx_export.render_diet_plan_docx(document),
        media_type=DOCX_MEDIA_TYPE,
        filename="mi-dieta.docx",
    )

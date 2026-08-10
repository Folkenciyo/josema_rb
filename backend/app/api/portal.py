import io

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.rate_limit import SlidingWindowLimiter
from app.models import Client
from app.schemas.export import DietPlanDocument, TrainingPlanDocument
from app.schemas.portal import PortalClientOut, PortalWeighInOut
from app.services import docx_export, export_service, pdf_export, portal_service

DOCX_MEDIA_TYPE = (
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
)

# Guessing a 32-byte token is hopeless anyway; this is defence in depth against
# someone hammering the endpoint. Only failed attempts count, so a client
# reloading their own portal all day is never locked out.
portal_limiter = SlidingWindowLimiter(max_attempts=20, window_seconds=300)

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
        portal_limiter.record_failure(caller)
        raise


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

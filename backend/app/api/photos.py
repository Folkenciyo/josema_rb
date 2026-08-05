import io
import uuid
from datetime import date

from fastapi import APIRouter, Depends, File, Form, Response, UploadFile, status
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import get_current_trainer
from app.models import ClientPhoto, PhotoPose
from app.schemas.photo import PhotoOut
from app.services import docx_export, pdf_export, photo_service, progress_service

router = APIRouter(tags=["photos"], dependencies=[Depends(get_current_trainer)])


@router.get("/api/clients/{client_id}/photos", response_model=list[PhotoOut])
def list_photos(
    client_id: uuid.UUID, db: Session = Depends(get_db)
) -> list[ClientPhoto]:
    return photo_service.list_photos(db, client_id)


@router.post(
    "/api/clients/{client_id}/photos",
    response_model=PhotoOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_photo(
    client_id: uuid.UUID,
    taken_on: date = Form(...),
    pose: PhotoPose = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> ClientPhoto:
    return await photo_service.create_photo(
        db, client_id, taken_on=taken_on, pose=pose, upload=file
    )


@router.get("/api/photos/{photo_id}/file")
def get_photo_file(
    photo_id: uuid.UUID, thumbnail: bool = False, db: Session = Depends(get_db)
) -> FileResponse:
    """Body photos are served here, behind the session, never as static files."""
    path = photo_service.photo_file(db, photo_id, thumbnail=thumbnail)
    return FileResponse(
        path,
        media_type="image/jpeg",
        headers={"Cache-Control": "private, max-age=3600"},
    )


@router.delete("/api/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_photo(photo_id: uuid.UUID, db: Session = Depends(get_db)) -> Response:
    photo_service.delete_photo(db, photo_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/api/clients/{client_id}/progress/export/pdf")
def export_progress_pdf(
    client_id: uuid.UUID,
    before: date | None = None,
    after: date | None = None,
    db: Session = Depends(get_db),
) -> StreamingResponse:
    """Defaults to the widest comparison: first session against the last one."""
    document = progress_service.build_progress_document(
        db, client_id, before=before, after=after
    )
    pdf_bytes = pdf_export.render_progress_pdf(document)
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="seguimiento.pdf"'},
    )


@router.get("/api/clients/{client_id}/progress/export/docx")
def export_progress_docx(
    client_id: uuid.UUID,
    before: date | None = None,
    after: date | None = None,
    db: Session = Depends(get_db),
) -> StreamingResponse:
    document = progress_service.build_progress_document(
        db, client_id, before=before, after=after
    )
    docx_bytes = docx_export.render_progress_docx(document)
    return StreamingResponse(
        io.BytesIO(docx_bytes),
        media_type=(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ),
        headers={"Content-Disposition": 'attachment; filename="seguimiento.docx"'},
    )

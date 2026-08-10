from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import get_current_trainer
from app.models import Trainer
from app.schemas.portal import InviteTemplatesOut, InviteTemplatesUpdate
from app.services import invite_service

router = APIRouter(
    prefix="/api/settings",
    tags=["settings"],
    dependencies=[Depends(get_current_trainer)],
)


@router.get("/invite-templates", response_model=InviteTemplatesOut)
def get_invite_templates(
    trainer: Trainer = Depends(get_current_trainer),
) -> InviteTemplatesOut:
    return invite_service.get_templates(trainer)


@router.put("/invite-templates", response_model=InviteTemplatesOut)
def update_invite_templates(
    payload: InviteTemplatesUpdate,
    trainer: Trainer = Depends(get_current_trainer),
    db: Session = Depends(get_db),
) -> InviteTemplatesOut:
    return invite_service.update_templates(db, trainer, payload)

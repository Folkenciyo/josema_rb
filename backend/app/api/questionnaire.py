import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import get_current_trainer
from app.models import QuestionnaireQuestion, Trainer
from app.schemas.questionnaire import (
    ClientQuestionnaireOut,
    QuestionOut,
    SetQuestionnaireRequest,
)
from app.services import client_service, questionnaire_service

router = APIRouter(tags=["questionnaire"], dependencies=[Depends(get_current_trainer)])


@router.get("/api/settings/questionnaire", response_model=list[QuestionOut])
def get_questionnaire(
    trainer: Trainer = Depends(get_current_trainer), db: Session = Depends(get_db)
) -> list[QuestionnaireQuestion]:
    return questionnaire_service.list_questions(db, trainer)


@router.put("/api/settings/questionnaire", response_model=list[QuestionOut])
def set_questionnaire(
    payload: SetQuestionnaireRequest,
    trainer: Trainer = Depends(get_current_trainer),
    db: Session = Depends(get_db),
) -> list[QuestionnaireQuestion]:
    return questionnaire_service.set_questions(db, trainer, payload.questions)


@router.get(
    "/api/clients/{client_id}/questionnaire", response_model=ClientQuestionnaireOut
)
def get_client_questionnaire(
    client_id: uuid.UUID, db: Session = Depends(get_db)
) -> ClientQuestionnaireOut:
    client = client_service.get_client(db, client_id)
    return questionnaire_service.build_client_view(db, client)

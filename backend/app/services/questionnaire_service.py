import uuid
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import (
    Client,
    ClientAnswer,
    QuestionKind,
    QuestionnaireQuestion,
    Trainer,
)
from app.schemas.profile import ClientProfileIn
from app.schemas.questionnaire import (
    AnswerIn,
    AnswerOut,
    ClientQuestionnaireOut,
    PortalQuestionnaireOut,
    PortalQuestionOut,
    QuestionIn,
    QuestionnaireOut,
    QuestionOut,
)
from app.services import client_profile_service


def list_questions(db: Session, trainer: Trainer) -> list[QuestionnaireQuestion]:
    return (
        db.query(QuestionnaireQuestion)
        .filter(QuestionnaireQuestion.trainer_id == trainer.id)
        .order_by(QuestionnaireQuestion.order_index)
        .all()
    )


def build_editor_view(db: Session, trainer: Trainer) -> QuestionnaireOut:
    return QuestionnaireOut(
        intro=trainer.questionnaire_intro,
        questions=[
            QuestionOut.model_validate(question)
            for question in list_questions(db, trainer)
        ],
    )


def set_questionnaire(
    db: Session, trainer: Trainer, questions: list[QuestionIn], intro: str | None
) -> QuestionnaireOut:
    """Replace the questionnaire with the list given, in that order.

    Answers already given are not touched: they carry their own copy of the
    wording, and the ones whose question disappears simply lose the link.
    """
    trainer.questionnaire_intro = (intro or "").strip() or None
    _set_questions(db, trainer, questions)
    return build_editor_view(db, trainer)


def _set_questions(
    db: Session, trainer: Trainer, questions: list[QuestionIn]
) -> list[QuestionnaireQuestion]:
    for question in list_questions(db, trainer):
        db.delete(question)
    db.flush()

    stored = []
    for order_index, question in enumerate(questions):
        _reject_choice_without_options(question)
        stored.append(
            QuestionnaireQuestion(
                trainer_id=trainer.id,
                text=question.text.strip(),
                help_text=(question.help_text or "").strip() or None,
                kind=question.kind,
                options=_clean_options(question),
                required=question.required,
                order_index=order_index,
            )
        )

    db.add_all(stored)
    db.commit()
    return list_questions(db, trainer)


def build_portal_view(
    db: Session, trainer: Trainer, client: Client
) -> PortalQuestionnaireOut:
    questions = list_questions(db, trainer)
    answers = {
        answer.question_id: answer
        for answer in _client_answers(db, client.id)
        if answer.question_id is not None
    }

    return PortalQuestionnaireOut(
        intro=trainer.questionnaire_intro,
        profile=client_profile_service.profile_of(client),
        questions=[
            PortalQuestionOut(
                id=question.id,
                text=question.text,
                help_text=question.help_text,
                kind=question.kind,
                options=question.options,
                required=question.required,
                order_index=question.order_index,
                answer=answers[question.id].answer if question.id in answers else None,
            )
            for question in questions
        ],
        completed_at=_completed_at(list(answers.values())),
    )


def submit_answers(
    db: Session,
    trainer: Trainer,
    client: Client,
    answers: list[AnswerIn],
    profile: ClientProfileIn,
) -> PortalQuestionnaireOut:
    """Save what the client filled in, replacing their previous answers.

    The five file fields at the top are demanded every time — they are the ones
    the trainer cannot work without. Beyond them, optional questions may be left
    blank and filled in on a later visit; only the ones the trainer marked as
    required are asked for.
    """
    questions = {question.id: question for question in list_questions(db, trainer)}
    given = {answer.question_id: answer.answer for answer in answers}

    _reject_unknown_questions(given, questions)
    # The file block comes first because that is where it sits on the screen:
    # being told about the last question while the first box is empty reads
    # like the form skipped over it.
    client_profile_service.apply_profile(client, profile, datetime.now(UTC).date())
    _reject_missing_required(given, questions)

    for previous in _client_answers(db, client.id):
        db.delete(previous)
    db.flush()

    now = datetime.now(UTC)
    for question in questions.values():
        text = (given.get(question.id) or "").strip()
        db.add(
            ClientAnswer(
                client_id=client.id,
                question_id=question.id,
                question_text=question.text,
                answer=text or None,
                order_index=question.order_index,
                answered_at=now if text else None,
            )
        )

    db.commit()
    return build_portal_view(db, trainer, client)


def build_client_view(db: Session, client: Client) -> ClientQuestionnaireOut:
    answers = _client_answers(db, client.id)

    return ClientQuestionnaireOut(
        answers=[AnswerOut.model_validate(answer) for answer in answers],
        completed_at=_completed_at(answers),
    )


def _client_answers(db: Session, client_id: uuid.UUID) -> list[ClientAnswer]:
    return (
        db.query(ClientAnswer)
        .filter(ClientAnswer.client_id == client_id)
        .order_by(ClientAnswer.order_index)
        .all()
    )


def _completed_at(answers: list[ClientAnswer]) -> datetime | None:
    """When the client last touched the questionnaire, blank answers aside."""
    timestamps = [answer.answered_at for answer in answers if answer.answered_at]
    return max(timestamps) if timestamps else None


def _clean_options(question: QuestionIn) -> list[str] | None:
    if question.kind is not QuestionKind.CHOICE:
        return None
    return [option.strip() for option in (question.options or []) if option.strip()]


def _reject_choice_without_options(question: QuestionIn) -> None:
    if question.kind is QuestionKind.CHOICE and not _clean_options(question):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f'The question "{question.text}" needs at least one option',
        )


def _reject_unknown_questions(
    given: dict[uuid.UUID, str | None],
    questions: dict[uuid.UUID, QuestionnaireQuestion],
) -> None:
    """An id that is not in the questionnaire is a stale form, not an answer."""
    unknown = set(given) - set(questions)
    if unknown:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The questionnaire has changed, reload it and try again",
        )


def _reject_missing_required(
    given: dict[uuid.UUID, str | None],
    questions: dict[uuid.UUID, QuestionnaireQuestion],
) -> None:
    missing = [
        question.text
        for question_id, question in questions.items()
        if question.required and not (given.get(question_id) or "").strip()
    ]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"Falta contestar: {', '.join(missing)}",
        )

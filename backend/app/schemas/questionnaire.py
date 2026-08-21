import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.questionnaire import QuestionKind


class QuestionIn(BaseModel):
    text: str = Field(min_length=1, max_length=500)
    help_text: str | None = None
    kind: QuestionKind = QuestionKind.SHORT_TEXT
    # Required (and only used) when kind is "choice".
    options: list[str] | None = None
    required: bool = False


# Long enough for a real welcome, short enough that nobody pastes a book into
# a client's phone screen.
MAX_INTRO_LENGTH = 4000


class SetQuestionnaireRequest(BaseModel):
    """Replaces the whole questionnaire in one go, in the order given."""

    questions: list[QuestionIn] = []
    # Empty or blank clears it, the same way an empty invitation template
    # restores the stock wording.
    intro: str | None = Field(default=None, max_length=MAX_INTRO_LENGTH)


class QuestionOut(BaseModel):
    id: uuid.UUID
    text: str
    help_text: str | None
    kind: QuestionKind
    options: list[str] | None
    required: bool
    order_index: int

    model_config = {"from_attributes": True}


class AnswerIn(BaseModel):
    question_id: uuid.UUID
    answer: str | None = None


class SubmitAnswersRequest(BaseModel):
    answers: list[AnswerIn] = []


class AnswerOut(BaseModel):
    """An answer as stored: the wording travels with it, not just the id."""

    question_id: uuid.UUID | None
    question_text: str
    answer: str | None
    order_index: int
    answered_at: datetime | None

    model_config = {"from_attributes": True}


class PortalQuestionOut(QuestionOut):
    """A question as the client sees it, with whatever they answered before."""

    answer: str | None = None


class QuestionnaireOut(BaseModel):
    """The whole questionnaire as the trainer edits it."""

    intro: str | None
    questions: list[QuestionOut]


class PortalQuestionnaireOut(BaseModel):
    # Shown above the questions, every time: it is a welcome, not an instruction
    # that stops being true once answered.
    intro: str | None
    questions: list[PortalQuestionOut]
    # Null while the client has not answered a single question.
    completed_at: datetime | None


class ClientQuestionnaireOut(BaseModel):
    """What the trainer reads on the client's file."""

    answers: list[AnswerOut]
    completed_at: datetime | None

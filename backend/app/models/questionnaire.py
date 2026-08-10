import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class QuestionKind(StrEnum):
    SHORT_TEXT = "short_text"
    LONG_TEXT = "long_text"
    NUMBER = "number"
    YES_NO = "yes_no"
    CHOICE = "choice"


class QuestionnaireQuestion(Base, TimestampMixin):
    """A question the trainer writes once and every client answers.

    The questionnaire belongs to the trainer, not to a client: editing it changes
    what future clients are asked, never what past ones already answered.
    """

    __tablename__ = "questionnaire_questions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    trainer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("trainers.id"), nullable=False
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    help_text: Mapped[str | None] = mapped_column(Text)
    kind: Mapped[QuestionKind] = mapped_column(
        Enum(QuestionKind, name="question_kind"),
        nullable=False,
        default=QuestionKind.SHORT_TEXT,
    )
    # Only meaningful for CHOICE; a plain list of strings.
    options: Mapped[list[str] | None] = mapped_column(JSONB)
    required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)


class ClientAnswer(Base, TimestampMixin):
    """A client's answer, with the question copied in.

    The wording is a snapshot on purpose, like the diet macros: rewriting or
    deleting a question later must not rewrite what someone already answered.
    """

    __tablename__ = "client_answers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Kept to match answers with the live question, dropped to NULL if the
    # trainer deletes it — the answer itself survives.
    question_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("questionnaire_questions.id", ondelete="SET NULL"),
    )
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str | None] = mapped_column(Text)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    answered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    client: Mapped["Client"] = relationship(back_populates="answers")  # noqa: F821

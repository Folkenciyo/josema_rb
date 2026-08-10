import uuid

from sqlalchemy import String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Trainer(Base, TimestampMixin):
    __tablename__ = "trainers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255))
    # Wording of the portal invitation, with {nombre} and {enlace} placeholders.
    # Null means "use the stock text", so clearing a field restores the default.
    invite_whatsapp_template: Mapped[str | None] = mapped_column(Text)
    invite_email_subject: Mapped[str | None] = mapped_column(String(255))
    invite_email_template: Mapped[str | None] = mapped_column(Text)

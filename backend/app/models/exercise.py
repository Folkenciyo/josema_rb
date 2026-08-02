import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Exercise(Base, TimestampMixin):
    __tablename__ = "exercises"

    # String id: the free-exercise-db slug (e.g. "3_4_Sit-Up") for imported
    # exercises, or a generated uuid4 string for trainer-created ones.
    id: Mapped[str] = mapped_column(String(255), primary_key=True)

    created_by_trainer_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("trainers.id")
    )

    name_en: Mapped[str | None] = mapped_column(String(255))
    name_es: Mapped[str] = mapped_column(String(255), nullable=False)

    category_en: Mapped[str | None] = mapped_column(String(100))
    category_es: Mapped[str | None] = mapped_column(String(100))

    level_en: Mapped[str | None] = mapped_column(String(50))
    level_es: Mapped[str | None] = mapped_column(String(50))

    force_en: Mapped[str | None] = mapped_column(String(50))
    force_es: Mapped[str | None] = mapped_column(String(50))

    mechanic_en: Mapped[str | None] = mapped_column(String(50))
    mechanic_es: Mapped[str | None] = mapped_column(String(50))

    equipment_en: Mapped[str | None] = mapped_column(String(100))
    equipment_es: Mapped[str | None] = mapped_column(String(100))

    primary_muscles_en: Mapped[list[str]] = mapped_column(JSONB, default=list)
    primary_muscles_es: Mapped[list[str]] = mapped_column(JSONB, default=list)
    secondary_muscles_en: Mapped[list[str]] = mapped_column(JSONB, default=list)
    secondary_muscles_es: Mapped[list[str]] = mapped_column(JSONB, default=list)

    instructions_en: Mapped[list[str]] = mapped_column(JSONB, default=list)
    instructions_es: Mapped[list[str]] = mapped_column(JSONB, default=list)

    # Relative paths served from /static/exercise-images/
    images: Mapped[list[str]] = mapped_column(JSONB, default=list)

    source: Mapped[str] = mapped_column(
        String(50), default="free-exercise-db", nullable=False
    )

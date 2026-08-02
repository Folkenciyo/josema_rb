import uuid

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Food(Base, TimestampMixin):
    """Reusable ingredient catalog entry (macros per one unit of `unit_label`)."""

    __tablename__ = "foods"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    trainer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("trainers.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    unit_label: Mapped[str] = mapped_column(String(50), nullable=False)
    calories: Mapped[float] = mapped_column(Numeric(6, 1), nullable=False)
    protein_g: Mapped[float] = mapped_column(Numeric(6, 1), nullable=False)
    carbs_g: Mapped[float] = mapped_column(Numeric(6, 1), nullable=False)
    fat_g: Mapped[float] = mapped_column(Numeric(6, 1), nullable=False)

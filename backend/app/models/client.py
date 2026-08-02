import uuid
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.diet_plan import DietPlan
    from app.models.training_plan import TrainingPlan


class Client(Base, TimestampMixin):
    __tablename__ = "clients"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    trainer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("trainers.id"), nullable=False
    )
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(50))
    birth_date: Mapped[date | None] = mapped_column(Date)
    sex: Mapped[str | None] = mapped_column(String(20))
    height_cm: Mapped[float | None] = mapped_column(Numeric(5, 1))
    goals: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    training_plans: Mapped[list["TrainingPlan"]] = relationship(back_populates="client")
    diet_plans: Mapped[list["DietPlan"]] = relationship(back_populates="client")

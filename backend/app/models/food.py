import uuid

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


def format_unit_label(amount: float, unit_type: str) -> str:
    """Render a reference quantity the way a label reads: "100 g", "1 unidad"."""
    rounded = float(amount)
    text = str(int(rounded)) if rounded.is_integer() else f"{rounded:g}"
    return f"{text} {unit_type}"


class Food(Base, TimestampMixin):
    """Reusable ingredient catalog entry.

    All nutrition values are expressed per one reference quantity, described by
    `unit_amount` + `unit_type` (e.g. 100 + "g", or 1 + "unidad"). Splitting the
    quantity from its unit is what lets a meal be written in real amounts
    ("150 g") instead of a bare multiplier.
    """

    __tablename__ = "foods"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    trainer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("trainers.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    category: Mapped[str] = mapped_column(String(100), nullable=False)
    subcategory: Mapped[str | None] = mapped_column(String(100))

    unit_amount: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    unit_type: Mapped[str] = mapped_column(String(30), nullable=False)

    # Stable key for the curated catalog so re-seeding upserts instead of
    # duplicating. Trainer-created foods leave it null.
    slug: Mapped[str | None] = mapped_column(String(150), unique=True)
    # Informational only: seeded foods stay fully editable and deletable,
    # unlike imported exercises.
    source: Mapped[str] = mapped_column(String(20), default="custom", nullable=False)

    calories: Mapped[float] = mapped_column(Numeric(6, 1), nullable=False)
    protein_g: Mapped[float] = mapped_column(Numeric(6, 1), nullable=False)
    carbs_g: Mapped[float] = mapped_column(Numeric(6, 1), nullable=False)
    sugars_g: Mapped[float] = mapped_column(Numeric(6, 1), default=0, nullable=False)
    fat_g: Mapped[float] = mapped_column(Numeric(6, 1), nullable=False)
    saturated_fat_g: Mapped[float] = mapped_column(
        Numeric(6, 1), default=0, nullable=False
    )
    fiber_g: Mapped[float] = mapped_column(Numeric(6, 1), default=0, nullable=False)
    salt_g: Mapped[float] = mapped_column(Numeric(6, 2), default=0, nullable=False)

    @property
    def unit_label(self) -> str:
        return format_unit_label(self.unit_amount, self.unit_type)

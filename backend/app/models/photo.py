import uuid
from datetime import date
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import Date, Enum, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.client import Client


class PhotoPose(StrEnum):
    """Declaration order is display order: front, side, back."""

    FRONT = "front"
    SIDE = "side"
    BACK = "back"


class ClientPhoto(Base, TimestampMixin):
    """One progress photo: a client, a day and a pose.

    The files live on disk (see photo_storage); only their paths are stored.
    """

    __tablename__ = "client_photos"
    __table_args__ = (
        UniqueConstraint(
            "client_id", "taken_on", "pose", name="uq_photo_client_day_pose"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    taken_on: Mapped[date] = mapped_column(Date, nullable=False)
    pose: Mapped[PhotoPose] = mapped_column(
        Enum(PhotoPose, name="photo_pose"), nullable=False
    )
    file_path: Mapped[str] = mapped_column(String(255), nullable=False)
    thumb_path: Mapped[str] = mapped_column(String(255), nullable=False)

    client: Mapped["Client"] = relationship(back_populates="photos")

import uuid
from datetime import date, datetime

from pydantic import BaseModel

from app.models.photo import PhotoPose


class PhotoOut(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    taken_on: date
    pose: PhotoPose
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

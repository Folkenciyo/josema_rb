import uuid

from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class TrainerOut(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str | None

    model_config = {"from_attributes": True}

from datetime import date

from pydantic import BaseModel


class ClientProfileIn(BaseModel):
    """The five file fields the client fills in from their own portal.

    Typed loosely on purpose: every rule lives in `client_profile_service`, so a
    blank box comes back as "Faltan tus datos: Altura" instead of the schema's
    own wording, which the client would read in English.
    """

    email: str | None = None
    phone: str | None = None
    birth_date: date | None = None
    sex: str | None = None
    height_cm: float | None = None


class ClientProfileOut(ClientProfileIn):
    """The same five as they stand on the file right now.

    Still nullable: nothing forces the trainer to know any of it before the
    client has been through the questionnaire once.
    """

    model_config = {"from_attributes": True}

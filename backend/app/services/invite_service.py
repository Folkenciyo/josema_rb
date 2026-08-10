import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Trainer
from app.schemas.portal import (
    InviteTemplatesOut,
    InviteTemplatesUpdate,
    PortalInviteOut,
)
from app.services import client_service

FALLBACK_SIGNATURE = "Tu entrenador"

DEFAULT_EMAIL_SUBJECT = "Tu seguimiento personal"

DEFAULT_EMAIL_TEMPLATE = (
    "Hola {nombre}:\n\n"
    "Este es tu enlace personal. Desde ahí puedes ver tu rutina, tu dieta y tu "
    "peso, descargarlos en PDF o Word y apuntar cuánto pesas cada día:\n\n"
    "{enlace}\n\n"
    "Es privado, así que no lo compartas con nadie. Si lo abres en el móvil "
    "puedes añadirlo a la pantalla de inicio y entrar de un toque.\n\n"
    "Un saludo,\n{entrenador}"
)

DEFAULT_WHATSAPP_TEMPLATE = (
    "Hola {nombre}! Este es tu enlace personal para ver tu rutina, tu dieta y "
    "tu peso: {enlace}\n\n"
    "Es privado, no lo compartas. Puedes añadirlo a la pantalla de inicio del "
    "móvil. — {entrenador}"
)

# Everything the trainer may drop into their own wording. Anything else is left
# untouched, so a stray "{" in the text is text and never an error.
PLACEHOLDERS = ("nombre", "nombre_completo", "enlace", "entrenador")


def get_templates(trainer: Trainer) -> InviteTemplatesOut:
    """What the settings screen edits, already filled in with the stock text."""
    return InviteTemplatesOut(
        whatsapp_template=trainer.invite_whatsapp_template
        or DEFAULT_WHATSAPP_TEMPLATE,
        email_subject=trainer.invite_email_subject or DEFAULT_EMAIL_SUBJECT,
        email_template=trainer.invite_email_template or DEFAULT_EMAIL_TEMPLATE,
        placeholders=list(PLACEHOLDERS),
    )


def update_templates(
    db: Session, trainer: Trainer, data: InviteTemplatesUpdate
) -> InviteTemplatesOut:
    """Saving an empty field means "back to the stock text", not an empty message."""
    trainer.invite_whatsapp_template = _blank_to_none(data.whatsapp_template)
    trainer.invite_email_subject = _blank_to_none(data.email_subject)
    trainer.invite_email_template = _blank_to_none(data.email_template)
    db.commit()
    db.refresh(trainer)

    return get_templates(trainer)


def build_invite(
    db: Session, client_id: uuid.UUID, trainer: Trainer, base_url: str
) -> PortalInviteOut:
    """Compose the message that hands a client their portal link.

    The wording lives in the backend on purpose: today it is delivered by the
    trainer's own phone (`mailto:` and a WhatsApp draft), and the day an SMTP
    account is plugged in the text is already written and does not move.
    """
    client = client_service.get_client(db, client_id)

    if not client.portal_token:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This client has no portal link yet",
        )

    url = f"{base_url.rstrip('/')}/p/{client.portal_token}"
    templates = get_templates(trainer)
    values = {
        "nombre": client.full_name.split(" ")[0],
        "nombre_completo": client.full_name,
        "enlace": url,
        "entrenador": trainer.full_name or FALLBACK_SIGNATURE,
    }

    return PortalInviteOut(
        url=url,
        subject=render(templates.email_subject, values),
        body=render(templates.email_template, values),
        whatsapp_text=render(templates.whatsapp_template, values),
    )


def render(template: str, values: dict[str, str]) -> str:
    """Fill in the placeholders by hand.

    `str.format` would blow up on a lone brace the trainer typed, and would also
    expose attribute lookups; a plain replace of the names we know cannot.
    """
    text = template
    for name in PLACEHOLDERS:
        text = text.replace("{" + name + "}", values.get(name, ""))
    return text


def _blank_to_none(value: str | None) -> str | None:
    stripped = (value or "").strip()
    return stripped or None

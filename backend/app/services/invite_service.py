import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Client, Trainer
from app.schemas.portal import PortalInviteOut
from app.services import client_service

FALLBACK_SIGNATURE = "Tu entrenador"


def build_invite(
    db: Session, client_id: uuid.UUID, trainer: Trainer, base_url: str
) -> PortalInviteOut:
    """Compose the message that hands a client their portal link.

    The wording lives here, in the backend, on purpose: today it is delivered by
    the trainer's own phone (`mailto:` and a WhatsApp draft), and the day an SMTP
    account is plugged in the text is already written and does not move.
    """
    client = client_service.get_client(db, client_id)

    if not client.portal_token:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This client has no portal link yet",
        )

    url = f"{base_url.rstrip('/')}/p/{client.portal_token}"
    signature = trainer.full_name or FALLBACK_SIGNATURE

    return PortalInviteOut(
        url=url,
        subject="Tu seguimiento personal",
        body=_email_body(client, url, signature),
        whatsapp_text=_whatsapp_text(client, url, signature),
    )


def _first_name(client: Client) -> str:
    return client.full_name.split(" ")[0]


def _email_body(client: Client, url: str, signature: str) -> str:
    return (
        f"Hola {_first_name(client)}:\n\n"
        "Este es tu enlace personal. Desde ahí puedes ver tu rutina, tu dieta y "
        "tu peso, descargarlos en PDF o Word y apuntar cuánto pesas cada día:\n\n"
        f"{url}\n\n"
        "Es privado, así que no lo compartas con nadie. Si lo abres en el móvil "
        "puedes añadirlo a la pantalla de inicio y entrar de un toque.\n\n"
        f"Un saludo,\n{signature}"
    )


def _whatsapp_text(client: Client, url: str, signature: str) -> str:
    return (
        f"Hola {_first_name(client)}! Este es tu enlace personal para ver tu "
        f"rutina, tu dieta y tu peso: {url}\n\n"
        "Es privado, no lo compartas. Puedes añadirlo a la pantalla de inicio "
        f"del móvil. — {signature}"
    )

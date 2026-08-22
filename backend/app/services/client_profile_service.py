"""The five file fields the client is asked for at the top of the questionnaire.

The file belongs to the trainer, but these five are the client's own data:
asking for them once, where the client is already typing, beats chasing them
by message one at a time. The trainer can still correct any of them by hand.
"""

import re
from datetime import date

from fastapi import HTTPException, status

from app.models import Client
from app.schemas.profile import ClientProfileIn, ClientProfileOut

# The three the file already speaks; the portal must not invent a fourth.
SEXES = ("male", "female", "other")

FIELD_LABELS = {
    "email": "Email",
    "phone": "Teléfono",
    "birth_date": "Nacimiento",
    "sex": "Sexo",
    "height_cm": "Altura",
}

# Deliberately loose: one @, a dot in the domain, no spaces. Anything stricter
# starts turning away real addresses.
EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
# Digits with the punctuation phone numbers are written with, six at least, so
# a country prefix on its own does not pass.
PHONE_PATTERN = re.compile(r"^\+?[\d][\d\s().-]{5,}$")

# They catch a slipped year, not an unusual client.
MIN_AGE_YEARS = 10
MAX_AGE_YEARS = 120

# Wide enough for a very short client and a very tall one, narrow enough that
# a height typed in metres or in millimetres is stopped.
MIN_HEIGHT_CM = 90
MAX_HEIGHT_CM = 250


def profile_of(client: Client) -> ClientProfileOut:
    return ClientProfileOut.model_validate(client)


def apply_profile(client: Client, profile: ClientProfileIn, today: date) -> None:
    """Write the five fields onto the file, refusing the lot if any is wrong.

    Nothing is committed here: the questionnaire saves the answers and the file
    in the same transaction, so a rejected form leaves neither half behind.
    """
    email = (profile.email or "").strip()
    phone = (profile.phone or "").strip()
    sex = (profile.sex or "").strip()

    _reject_blanks(profile, email=email, phone=phone, sex=sex)

    problems = [
        problem
        for problem in (
            None if EMAIL_PATTERN.match(email) else "El email no es válido",
            None if PHONE_PATTERN.match(phone) else "El teléfono no es válido",
            _birth_date_problem(profile.birth_date, today),
            None if sex in SEXES else "Elige una opción en Sexo",
            _height_problem(profile.height_cm),
        )
        if problem is not None
    ]
    if problems:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=". ".join(problems),
        )

    client.email = email
    client.phone = phone
    client.birth_date = profile.birth_date
    client.sex = sex
    client.height_cm = profile.height_cm


def _reject_blanks(
    profile: ClientProfileIn, *, email: str, phone: str, sex: str
) -> None:
    given = {
        "email": email,
        "phone": phone,
        "birth_date": profile.birth_date,
        "sex": sex,
        "height_cm": profile.height_cm,
    }
    missing = [FIELD_LABELS[field] for field, value in given.items() if not value]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"Faltan tus datos: {', '.join(missing)}",
        )


def _birth_date_problem(birth_date: date | None, today: date) -> str | None:
    if birth_date is None:
        return None

    age = _age_on(birth_date, today)
    if age < MIN_AGE_YEARS or age > MAX_AGE_YEARS:
        return "La fecha de nacimiento no es válida"
    return None


def _age_on(birth_date: date, today: date) -> int:
    """Whole years, so a birthday later this year has not happened yet."""
    had_birthday = (today.month, today.day) >= (birth_date.month, birth_date.day)
    return today.year - birth_date.year - (0 if had_birthday else 1)


def _height_problem(height_cm: float | None) -> str | None:
    if height_cm is None:
        return None
    if not MIN_HEIGHT_CM <= height_cm <= MAX_HEIGHT_CM:
        return f"La altura debe estar entre {MIN_HEIGHT_CM} y {MAX_HEIGHT_CM} cm"
    return None

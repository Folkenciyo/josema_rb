"""Stores the image that goes with a motivational quote.

Unlike body photos, these are public by design: the client portal is opened by
a token, not a session, and the same picture is shown to everybody. So they live
under `app/static`, served by StaticFiles like the exercise library.
"""

import io
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from PIL import Image, ImageOps, UnidentifiedImageError

QUOTE_IMAGES_DIR = Path(__file__).resolve().parent.parent / "static" / "quote-images"

MAX_UPLOAD_BYTES = 10 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}

# Wide enough for a phone at 3x, small enough to open on mobile data.
MAX_SIDE = 1400
JPEG_QUALITY = 82


def _to_jpeg(contents: bytes) -> bytes:
    """Resized, upright, and stripped of metadata."""
    try:
        image = Image.open(io.BytesIO(contents))
        image.load()
    except (UnidentifiedImageError, OSError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="El archivo no es una imagen que pueda leer",
        ) from exc

    image = ImageOps.exif_transpose(image)
    image.thumbnail((MAX_SIDE, MAX_SIDE), Image.Resampling.LANCZOS)
    if image.mode not in ("RGB", "L"):
        image = image.convert("RGB")

    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=JPEG_QUALITY, optimize=True)
    return buffer.getvalue()


async def save_image(quote_id: uuid.UUID, upload: UploadFile) -> str:
    """Writes the file and returns its path relative to the image directory."""
    if upload.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"Formato de imagen no admitido: {upload.content_type}",
        )

    contents = await upload.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="La imagen supera el límite de 10 MB",
        )

    QUOTE_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    name = f"{quote_id}.jpg"
    (QUOTE_IMAGES_DIR / name).write_bytes(_to_jpeg(contents))
    return name


def delete_image(relative_path: str | None) -> None:
    """Missing files are fine: the database row is the source of truth."""
    if not relative_path:
        return

    resolved = (QUOTE_IMAGES_DIR / relative_path).resolve()
    if resolved.is_relative_to(QUOTE_IMAGES_DIR.resolve()):
        resolved.unlink(missing_ok=True)

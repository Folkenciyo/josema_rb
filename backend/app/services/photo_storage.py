"""Turns an uploaded body photo into two files on disk.

Deliberately outside `app/static`: that directory is mounted by StaticFiles and
would serve these without asking for a session. Body photos go out through an
authenticated endpoint instead.
"""

import io
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from PIL import Image, ImageOps, UnidentifiedImageError

MEDIA_ROOT = Path(__file__).resolve().parent.parent / "media" / "client-photos"

MAX_UPLOAD_BYTES = 15 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic"}

# Big enough to compare a physique full screen, small enough to stay ~350 KB.
FULL_MAX_SIDE = 1600
THUMB_MAX_SIDE = 400
JPEG_QUALITY = 85


def _open_upright(contents: bytes) -> Image.Image:
    """Phone photos carry an EXIF orientation; without this they come out sideways."""
    try:
        image = Image.open(io.BytesIO(contents))
        image.load()
    except (UnidentifiedImageError, OSError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="The file is not a readable image",
        ) from exc

    return ImageOps.exif_transpose(image)


def _to_jpeg(image: Image.Image, max_side: int) -> bytes:
    """Resized copy with no metadata: EXIF also carries the GPS of the shot."""
    resized = image.copy()
    resized.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)

    if resized.mode not in ("RGB", "L"):
        resized = resized.convert("RGB")

    buffer = io.BytesIO()
    resized.save(buffer, format="JPEG", quality=JPEG_QUALITY, optimize=True)
    return buffer.getvalue()


async def save_photo(
    client_id: uuid.UUID, photo_id: uuid.UUID, upload: UploadFile
) -> tuple[str, str]:
    """Writes the full-size and thumbnail files, returning their relative paths."""
    if upload.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"Unsupported image type: {upload.content_type}",
        )

    contents = await upload.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Image exceeds the 15MB limit",
        )

    image = _open_upright(contents)
    client_dir = MEDIA_ROOT / str(client_id)
    client_dir.mkdir(parents=True, exist_ok=True)

    full_name = f"{photo_id}.jpg"
    thumb_name = f"{photo_id}_thumb.jpg"
    (client_dir / full_name).write_bytes(_to_jpeg(image, FULL_MAX_SIDE))
    (client_dir / thumb_name).write_bytes(_to_jpeg(image, THUMB_MAX_SIDE))

    return f"{client_id}/{full_name}", f"{client_id}/{thumb_name}"


def absolute_path(relative_path: str) -> Path:
    """Resolves a stored path, refusing anything that escapes the media root."""
    resolved = (MEDIA_ROOT / relative_path).resolve()
    if not resolved.is_relative_to(MEDIA_ROOT.resolve()):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found"
        )
    return resolved


def delete_files(*relative_paths: str) -> None:
    """Missing files are fine: the database row is the source of truth."""
    for relative_path in relative_paths:
        absolute_path(relative_path).unlink(missing_ok=True)

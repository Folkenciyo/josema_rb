"""Turns a pasted link into a media kind and a bare identifier.

Only the identifier is stored, never the URL and never an embed snippet: the
player URL is rebuilt from a fixed template at render time, so nothing a trainer
pastes can end up as markup on a client's phone.
"""

import re
from urllib.parse import urlparse

from fastapi import HTTPException, status

from app.models.quote import QuoteMedia

YOUTUBE_HOSTS = {
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "music.youtube.com",
    "youtu.be",
    "www.youtu.be",
}
INSTAGRAM_HOSTS = {"instagram.com", "www.instagram.com", "m.instagram.com"}

# YouTube ids are 11 chars; Instagram shortcodes run to about 11 too, but the
# format is not documented, so the bound is generous and the charset strict.
YOUTUBE_ID = re.compile(r"^[A-Za-z0-9_-]{11}$")
INSTAGRAM_CODE = re.compile(r"^[A-Za-z0-9_-]{5,30}$")

# /shorts/ID, /embed/ID, /live/ID, /v/ID all put the id in the second segment.
YOUTUBE_PATH_PREFIXES = {"shorts", "embed", "live", "v"}
# A reel and a post embed identically; both are worth allowing.
INSTAGRAM_PATH_PREFIXES = {"reel", "reels", "p", "tv"}


def _reject(message: str) -> None:
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=message
    )


def _youtube_id(parsed) -> str | None:
    segments = [segment for segment in parsed.path.split("/") if segment]

    if parsed.hostname in ("youtu.be", "www.youtu.be"):
        return segments[0] if segments else None

    if segments and segments[0] == "watch":
        # /watch?v=ID — the only form that carries the id in the query string.
        for pair in parsed.query.split("&"):
            name, _, value = pair.partition("=")
            if name == "v":
                return value
        return None

    if len(segments) >= 2 and segments[0] in YOUTUBE_PATH_PREFIXES:
        return segments[1]

    return None


def _instagram_code(parsed) -> str | None:
    segments = [segment for segment in parsed.path.split("/") if segment]

    # Reels posted by an account read /<user>/reel/<code>, so the prefix is not
    # always the first segment.
    for index, segment in enumerate(segments[:-1]):
        if segment in INSTAGRAM_PATH_PREFIXES:
            return segments[index + 1]

    return None


def parse_media_url(url: str) -> tuple[QuoteMedia, str]:
    """Classify a pasted link, or raise 422 explaining what was wrong with it."""
    parsed = urlparse(url.strip())

    if parsed.scheme not in ("http", "https"):
        _reject("El enlace debe empezar por http:// o https://")

    host = (parsed.hostname or "").lower()

    if host in YOUTUBE_HOSTS:
        video_id = _youtube_id(parsed)
        if not video_id or not YOUTUBE_ID.match(video_id):
            _reject("No he reconocido el vídeo en ese enlace de YouTube")
        return QuoteMedia.YOUTUBE, video_id

    if host in INSTAGRAM_HOSTS:
        code = _instagram_code(parsed)
        if not code or not INSTAGRAM_CODE.match(code):
            _reject("No he reconocido el reel en ese enlace de Instagram")
        return QuoteMedia.INSTAGRAM, code

    _reject("Solo admito enlaces de YouTube o de Instagram")
    raise AssertionError("unreachable")  # pragma: no cover

"""Derive every brand asset the app and the documents use from LOGO.png.

LOGO.png (the artwork the trainer supplied) already carries a clean alpha
channel, so nothing is cut out here: the wordmark is trimmed and resized, and
the RB emblem is cropped off its right-hand side to serve as the app icon.

Run it after replacing the source artwork:

    uv run python -m scripts.build_brand_assets
"""

from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parent.parent.parent
SOURCE = REPO / "frontend" / "public" / "LOGO.png"
PUBLIC_BRAND = REPO / "frontend" / "public" / "brand"
PUBLIC_ICONS = REPO / "frontend" / "public" / "icons"
APP_DIR = REPO / "frontend" / "src" / "app"
BACKEND_BRAND = REPO / "backend" / "app" / "static" / "brand"

INK = (11, 11, 13)  # #0B0B0D, the brand black


def monogram_of(image: Image.Image) -> Image.Image:
    """Crop the RB emblem: the widest run of columns carrying brand red."""
    width, height = image.size
    pixels = image.load()

    red_columns = []
    for x in range(width):
        for y in range(0, height, 3):
            r, g, b, a = pixels[x, y]
            if a > 128 and r > 90 and r > g * 2 and r > b * 2:
                red_columns.append(x)
                break

    runs: list[list[int]] = []
    for x in red_columns:
        if runs and x - runs[-1][-1] <= 8:
            runs[-1].append(x)
        else:
            runs.append([x])

    # The A's small red triangle also scores; RB is by far the widest run.
    widest = max(runs, key=len)
    crop = image.crop((widest[0], 0, width, height))
    return crop.crop(crop.getbbox())


def on_ink(image: Image.Image, size: int, scale: float) -> Image.Image:
    """Centre the artwork on the brand black, at `scale` of the canvas."""
    canvas = Image.new("RGBA", (size, size), (*INK, 255))
    art = image.copy()
    art.thumbnail((int(size * scale), int(size * scale)), Image.LANCZOS)
    canvas.paste(art, ((size - art.width) // 2, (size - art.height) // 2), art)
    return canvas.convert("RGB")


def _save_resized(image: Image.Image, path: Path, box: int) -> None:
    resized = image.copy()
    resized.thumbnail((box, box), Image.LANCZOS)
    resized.save(path)


def main() -> None:
    for directory in (PUBLIC_BRAND, BACKEND_BRAND):
        directory.mkdir(parents=True, exist_ok=True)

    source = Image.open(SOURCE).convert("RGBA")
    wordmark = source.crop(source.getbbox())
    monogram = monogram_of(wordmark)

    for directory in (PUBLIC_BRAND, BACKEND_BRAND):
        _save_resized(wordmark, directory / "logo-wordmark.png", 1200)
        _save_resized(monogram, directory / "logo-monogram.png", 600)

    # The document header is composited on the brand black once, so WeasyPrint
    # and Word both get a plain opaque image instead of an alpha channel.
    header = Image.new("RGBA", (1600, 260), (*INK, 255))
    art = wordmark.copy()
    art.thumbnail((1180, 180), Image.LANCZOS)
    header.paste(art, ((1600 - art.width) // 2, (260 - art.height) // 2), art)
    header.convert("RGB").save(BACKEND_BRAND / "document-header.png")

    for size in (192, 512):
        on_ink(monogram, size, 0.62).save(PUBLIC_ICONS / f"icon-{size}.png")
        # Maskable icons lose the outer ~10% to the platform's mask.
        on_ink(monogram, size, 0.44).save(
            PUBLIC_ICONS / f"icon-maskable-{size}.png"
        )
    on_ink(monogram, 180, 0.62).save(PUBLIC_ICONS / "apple-touch-icon.png")
    on_ink(monogram, 96, 0.72).save(APP_DIR / "icon.png")
    # favicon.ico wins over icon.png in the App Router, so it has to carry the
    # brand too: leaving the one Next ships with is what put a stranger's logo
    # on every shared link.
    # RGBA and not RGB: Next refuses to decode an .ico whose frames are not
    # RGBA, and the build fails outright rather than warning.
    on_ink(monogram, 256, 0.72).convert("RGBA").save(
        APP_DIR / "favicon.ico",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )

    # What WhatsApp, Telegram and the like show when the link is shared. 1200x630
    # is the size every one of them crops from.
    preview = Image.new("RGBA", (1200, 630), (*INK, 255))
    art = wordmark.copy()
    art.thumbnail((820, 380), Image.LANCZOS)
    preview.paste(art, ((1200 - art.width) // 2, (630 - art.height) // 2), art)
    preview.convert("RGB").save(PUBLIC_BRAND / "og-image.png", quality=92)

    print(f"Brand assets rebuilt from {SOURCE.name}")


if __name__ == "__main__":
    main()

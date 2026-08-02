"""One-shot dev script: download the free-exercise-db dataset (Unlicense) and
vendorize it as app/data/exercises_en.json + app/static/exercise-images/<id>/*.jpg.

Run manually with: uv run python scripts/import_exercises.py
"""

import json
import time
import urllib.request
from pathlib import Path

RAW_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main"
EXERCISES_JSON_URL = f"{RAW_BASE}/dist/exercises.json"

BACKEND_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = BACKEND_ROOT / "app" / "data"
IMAGES_DIR = BACKEND_ROOT / "app" / "static" / "exercise-images"


def download_json(url: str) -> list[dict]:
    with urllib.request.urlopen(url) as response:  # noqa: S310
        return json.loads(response.read())


def download_file(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(url) as response:  # noqa: S310
        dest.write_bytes(response.read())


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Downloading exercise list from {EXERCISES_JSON_URL} ...")
    exercises = download_json(EXERCISES_JSON_URL)
    print(f"Got {len(exercises)} exercises.")

    (DATA_DIR / "exercises_en.json").write_text(
        json.dumps(exercises, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    total_images = sum(len(ex.get("images", [])) for ex in exercises)
    downloaded = 0
    for exercise in exercises:
        for image_path in exercise.get("images", []):
            dest = IMAGES_DIR / image_path
            if dest.exists():
                downloaded += 1
                continue
            url = f"{RAW_BASE}/exercises/{image_path}"
            try:
                download_file(url, dest)
            except Exception as exc:  # noqa: BLE001
                print(f"Failed to download {url}: {exc}")
                continue
            downloaded += 1
            if downloaded % 100 == 0:
                print(f"  {downloaded}/{total_images} images downloaded")
            time.sleep(0.02)

    print(f"Done. {downloaded}/{total_images} images downloaded to {IMAGES_DIR}")
    print(f"Exercise data written to {DATA_DIR / 'exercises_en.json'}")


if __name__ == "__main__":
    main()

"""One-shot dev script: vendorize the ExerciseDB catalogue (MIT data) as
app/data/exercisedb_en_es.json, keeping only the English and Spanish fields.

The media in that repository belongs to Gym visual and is NOT downloaded: these
exercises land in the catalogue without images, and the trainer can upload a
photo from the exercise form for the ones he actually uses.

Run manually with: uv run python scripts/exercisedb/fetch_exercisedb.py
"""

import json
import urllib.request
from pathlib import Path
from typing import Any

SOURCE_URL = (
    "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset"
    "/main/data/exercises.json"
)

SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_ROOT = SCRIPT_DIR.parent.parent
OUTPUT_PATH = BACKEND_ROOT / "app" / "data" / "exercisedb_en_es.json"


def download_json(url: str) -> list[dict[str, Any]]:
    request = urllib.request.Request(url, headers={"User-Agent": "josema-rb"})
    with urllib.request.urlopen(request, timeout=120) as response:  # noqa: S310
        return json.loads(response.read())


def main() -> None:
    exercises = download_json(SOURCE_URL)
    print(f"Got {len(exercises)} exercises from ExerciseDB.")

    trimmed = [
        {
            "id": ex["id"],
            "name_en": ex["name"],
            "body_part": ex.get("body_part"),
            "equipment": ex.get("equipment"),
            "target": ex.get("target"),
            "secondary_muscles": ex.get("secondary_muscles") or [],
            "instructions_en": (ex.get("instruction_steps") or {}).get("en", []),
            "instructions_es": (ex.get("instruction_steps") or {}).get("es", []),
        }
        for ex in exercises
    ]

    OUTPUT_PATH.write_text(
        json.dumps(trimmed, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"Wrote {len(trimmed)} exercises to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()

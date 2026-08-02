"""Split app/data/exercises_en.json into translation batches of ~50 exercises.

Each batch file contains only the fields that need free-text translation
(name + instructions); the closed-vocabulary fields are handled by enums_es.json.

Run with: uv run python scripts/translation/split_batches.py
"""

import json
from pathlib import Path

BATCH_SIZE = 50

SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_ROOT = SCRIPT_DIR.parent.parent
EXERCISES_EN_PATH = BACKEND_ROOT / "app" / "data" / "exercises_en.json"
BATCHES_DIR = SCRIPT_DIR / "batches"


def main() -> None:
    exercises = json.loads(EXERCISES_EN_PATH.read_text(encoding="utf-8"))
    BATCHES_DIR.mkdir(parents=True, exist_ok=True)

    batch_count = 0
    for start in range(0, len(exercises), BATCH_SIZE):
        batch_count += 1
        chunk = exercises[start : start + BATCH_SIZE]
        payload = [
            {
                "id": ex["id"],
                "name_en": ex["name"],
                "instructions_en": ex.get("instructions", []),
            }
            for ex in chunk
        ]
        batch_path = BATCHES_DIR / f"batch_{batch_count:02d}.json"
        batch_path.write_text(
            json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8"
        )

    print(f"Wrote {batch_count} batches ({len(exercises)} exercises) to {BATCHES_DIR}")


if __name__ == "__main__":
    main()

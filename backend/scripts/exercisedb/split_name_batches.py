"""Split the ExerciseDB catalogue into batches of names to translate.

Only the name needs a human translation: the instructions already ship in
Spanish and the closed-vocabulary fields are handled by enums_es.json. Names
that already exist in exercises_es_seed.json are dropped, so the two catalogues
do not collide.

Run with: uv run python scripts/exercisedb/split_name_batches.py
"""

import json
from pathlib import Path

from names_cleanup import clean_name, normalize

BATCH_SIZE = 100

SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_ROOT = SCRIPT_DIR.parent.parent
DATA_DIR = BACKEND_ROOT / "app" / "data"
SOURCE_PATH = DATA_DIR / "exercisedb_en_es.json"
EXISTING_SEED_PATH = DATA_DIR / "exercises_es_seed.json"
BATCHES_DIR = SCRIPT_DIR / "names"


def main() -> None:
    exercises = json.loads(SOURCE_PATH.read_text(encoding="utf-8"))
    existing = json.loads(EXISTING_SEED_PATH.read_text(encoding="utf-8"))
    taken = {normalize(ex["name_en"]) for ex in existing}

    pending: list[dict[str, str]] = []
    for ex in exercises:
        key = normalize(ex["name_en"])
        if key in taken:
            continue
        taken.add(key)
        pending.append({**ex, "name_en": clean_name(ex["name_en"])})

    print(f"{len(exercises)} in ExerciseDB, {len(pending)} not in the catalogue yet.")

    BATCHES_DIR.mkdir(parents=True, exist_ok=True)
    for stale in BATCHES_DIR.glob("names_*.json"):
        if not stale.name.endswith("_es.json"):
            stale.unlink()

    batch_count = 0
    for start in range(0, len(pending), BATCH_SIZE):
        batch_count += 1
        chunk = pending[start : start + BATCH_SIZE]
        payload = [
            {
                "id": ex["id"],
                "name_en": ex["name_en"],
                "equipment": ex["equipment"],
                "target": ex["target"],
            }
            for ex in chunk
        ]
        (BATCHES_DIR / f"names_{batch_count:02d}.json").write_text(
            json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8"
        )

    print(f"Wrote {batch_count} batches to {BATCHES_DIR}")


if __name__ == "__main__":
    main()

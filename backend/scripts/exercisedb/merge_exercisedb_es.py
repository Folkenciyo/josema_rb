"""Merge the translated ExerciseDB names + enums_es.json + the vendorized
catalogue into app/data/exercises_exercisedb_seed.json, with quality gates.

Run with: uv run python scripts/exercisedb/merge_exercisedb_es.py
"""

import json
import sys
from pathlib import Path
from typing import Any

from names_cleanup import clean_name

SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_ROOT = SCRIPT_DIR.parent.parent
DATA_DIR = BACKEND_ROOT / "app" / "data"
SOURCE_PATH = DATA_DIR / "exercisedb_en_es.json"
EXISTING_SEED_PATH = DATA_DIR / "exercises_es_seed.json"
ENUMS_PATH = SCRIPT_DIR / "enums_es.json"
BATCHES_DIR = SCRIPT_DIR / "names"
OUTPUT_PATH = DATA_DIR / "exercises_exercisedb_seed.json"

# Words that stay lowercase when the all-lowercase source name is title-cased.
MINOR_WORDS = {
    "a",
    "and",
    "at",
    "for",
    "in",
    "of",
    "on",
    "or",
    "the",
    "to",
    "with",
    "per",
}


def title_case(name: str) -> str:
    words = name.split(" ")
    return " ".join(
        word if index > 0 and word in MINOR_WORDS else word[:1].upper() + word[1:]
        for index, word in enumerate(words)
    )


def load_translated_names() -> dict[str, str]:
    translated: dict[str, str] = {}
    batch_files = sorted(BATCHES_DIR.glob("names_*_es.json"))
    if not batch_files:
        print("ERROR: no translated batch files found (names_XX_es.json)")
        sys.exit(1)
    for batch_file in batch_files:
        for entry in json.loads(batch_file.read_text(encoding="utf-8")):
            translated[entry["id"]] = entry["name_es"]
    return translated


def map_muscles(enum_map: dict[str, str | None], values: list[str]) -> list[str]:
    """Unknown muscles are dropped on purpose: they would pollute the filters."""
    mapped: list[str] = []
    for value in values:
        translated = enum_map.get(value.lower())
        if translated and translated not in mapped:
            mapped.append(translated)
    return mapped


def category_of(exercise: dict[str, Any]) -> tuple[str, str]:
    if exercise.get("body_part") == "cardio":
        return "cardio", "Cardio"
    if "stretch" in exercise["name_en"].lower():
        return "stretching", "Estiramientos"
    return "strength", "Fuerza"


def main() -> None:
    exercises = json.loads(SOURCE_PATH.read_text(encoding="utf-8"))
    enums = json.loads(ENUMS_PATH.read_text(encoding="utf-8"))
    translated = load_translated_names()

    errors: list[str] = []
    seed: list[dict[str, Any]] = []

    for ex in exercises:
        name_es = translated.get(ex["id"])
        if name_es is None:
            continue  # Not in the pending set: it is already in the catalogue.

        name_es = name_es.strip()
        name_en = title_case(clean_name(ex["name_en"]))
        if not name_es:
            errors.append(f"Empty name_es for id={ex['id']}")
            continue

        equipment_en = ex.get("equipment")
        equipment_es = enums["equipment"].get(equipment_en)
        if equipment_en and equipment_es is None:
            errors.append(f"No equipment mapping for '{equipment_en}' (id={ex['id']})")
            continue

        if not ex.get("instructions_es"):
            errors.append(f"No Spanish instructions for id={ex['id']}")
            continue

        category_en, category_es = category_of(ex)
        primary_es = map_muscles(
            enums["muscles"], [ex["target"]] if ex.get("target") else []
        )
        secondary_es = [
            muscle
            for muscle in map_muscles(enums["muscles"], ex.get("secondary_muscles", []))
            if muscle not in primary_es
        ]

        seed.append(
            {
                "id": f"exdb-{ex['id']}",
                "name_en": name_en,
                "name_es": name_es,
                "category_en": category_en,
                "category_es": category_es,
                # ExerciseDB carries no level, force or mechanic.
                "level_en": None,
                "level_es": None,
                "force_en": None,
                "force_es": None,
                "mechanic_en": None,
                "mechanic_es": None,
                "equipment_en": equipment_en,
                "equipment_es": equipment_es,
                "primary_muscles_en": [ex["target"]] if ex.get("target") else [],
                "primary_muscles_es": primary_es,
                "secondary_muscles_en": ex.get("secondary_muscles", []),
                "secondary_muscles_es": secondary_es,
                "instructions_en": ex.get("instructions_en", []),
                "instructions_es": ex.get("instructions_es", []),
                # Gym visual owns the media: these land without images.
                "images": [],
            }
        )

    # A movement the catalogue already has under another English name: the same
    # exercise, and the one already there has photos. Drop it rather than
    # offering the trainer the same thing twice.
    existing = json.loads(EXISTING_SEED_PATH.read_text(encoding="utf-8"))
    already_there = {ex["name_es"].lower() for ex in existing}
    deduped: list[dict[str, Any]] = []
    names_seen: dict[str, str] = {}
    skipped = 0
    for entry in seed:
        key = entry["name_es"].lower()
        if key in already_there:
            skipped += 1
            continue
        if key in names_seen:
            errors.append(
                f"Duplicate name_es '{entry['name_es']}' "
                f"({names_seen[key]} and {entry['id']})"
            )
        names_seen[key] = entry["id"]
        deduped.append(entry)
    seed = deduped

    if errors:
        print(f"Found {len(errors)} validation error(s):")
        for err in errors[:50]:
            print(f"  - {err}")
        if len(errors) > 50:
            print(f"  ... and {len(errors) - 50} more")
        sys.exit(1)

    OUTPUT_PATH.write_text(
        json.dumps(seed, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(
        f"Wrote {len(seed)} exercises to {OUTPUT_PATH} "
        f"({skipped} already in the catalogue under another English name)"
    )


if __name__ == "__main__":
    main()

"""Merge enums_es.json + translated batches + exercises_en.json into the final
exercises_es_seed.json artifact, with quality gates.

Run with: uv run python scripts/translation/merge_exercises_es.py
"""

import json
import sys
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_ROOT = SCRIPT_DIR.parent.parent
EXERCISES_EN_PATH = BACKEND_ROOT / "app" / "data" / "exercises_en.json"
ENUMS_PATH = SCRIPT_DIR / "enums_es.json"
BATCHES_DIR = SCRIPT_DIR / "batches"
OUTPUT_PATH = BACKEND_ROOT / "app" / "data" / "exercises_es_seed.json"


def load_translated_batches() -> dict[str, dict[str, Any]]:
    translated: dict[str, dict[str, Any]] = {}
    batch_files = sorted(BATCHES_DIR.glob("batch_*_es.json"))
    if not batch_files:
        print("ERROR: no translated batch files found (batch_XX_es.json)")
        sys.exit(1)
    for batch_file in batch_files:
        entries = json.loads(batch_file.read_text(encoding="utf-8"))
        for entry in entries:
            translated[entry["id"]] = entry
    return translated


def translate_field(enum_map: dict[str, str], value: str | None) -> str | None:
    if value is None:
        return None
    translated = enum_map.get(value)
    if translated is None:
        print(f"ERROR: no translation in enums_es.json for value '{value}'")
        sys.exit(1)
    return translated


def translate_list(enum_map: dict[str, str], values: list[str]) -> list[str]:
    return [translate_field(enum_map, v) for v in values]  # type: ignore[misc]


def main() -> None:
    exercises_en = json.loads(EXERCISES_EN_PATH.read_text(encoding="utf-8"))
    enums = json.loads(ENUMS_PATH.read_text(encoding="utf-8"))
    translated = load_translated_batches()

    errors: list[str] = []
    seed: list[dict[str, Any]] = []

    for ex in exercises_en:
        exercise_id = ex["id"]
        t = translated.get(exercise_id)
        if t is None:
            errors.append(f"Missing translation batch entry for id={exercise_id}")
            continue

        name_es = t.get("name_es", "").strip()
        if not name_es:
            errors.append(f"Empty name_es for id={exercise_id}")
        if name_es == ex["name"]:
            errors.append(
                "name_es identical to name_en (looks untranslated) "
                f"for id={exercise_id}"
            )

        instructions_en = ex.get("instructions", [])
        instructions_es = t.get("instructions_es", [])
        if len(instructions_es) != len(instructions_en):
            errors.append(
                f"instructions_es length mismatch for id={exercise_id}: "
                f"{len(instructions_es)} vs {len(instructions_en)}"
            )
        for step_en, step_es in zip(instructions_en, instructions_es, strict=False):
            if step_en and step_es.strip() == step_en.strip():
                errors.append(
                    f"instruction step looks untranslated for id={exercise_id}: "
                    f"'{step_en[:40]}...'"
                )

        seed.append(
            {
                "id": exercise_id,
                "name_en": ex["name"],
                "name_es": name_es,
                "category_en": ex.get("category"),
                "category_es": translate_field(enums["category"], ex.get("category")),
                "level_en": ex.get("level"),
                "level_es": translate_field(enums["level"], ex.get("level")),
                "force_en": ex.get("force"),
                "force_es": translate_field(enums["force"], ex.get("force")),
                "mechanic_en": ex.get("mechanic"),
                "mechanic_es": translate_field(enums["mechanic"], ex.get("mechanic")),
                "equipment_en": ex.get("equipment"),
                "equipment_es": translate_field(
                    enums["equipment"], ex.get("equipment")
                ),
                "primary_muscles_en": ex.get("primaryMuscles", []),
                "primary_muscles_es": translate_list(
                    enums["muscles"], ex.get("primaryMuscles", [])
                ),
                "secondary_muscles_en": ex.get("secondaryMuscles", []),
                "secondary_muscles_es": translate_list(
                    enums["muscles"], ex.get("secondaryMuscles", [])
                ),
                "instructions_en": instructions_en,
                "instructions_es": instructions_es,
                "images": ex.get("images", []),
            }
        )

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
    print(f"Wrote {len(seed)} exercises to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()

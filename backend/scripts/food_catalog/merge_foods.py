"""Quality gate for the curated food catalog.

Merges every scripts/food_catalog/batches/batch_*.json into
app/data/foods_es_seed.json, refusing to write anything if a single entry is
incomplete or internally inconsistent. Nothing half-filled reaches the trainer.

Run with: uv run python -m scripts.food_catalog.merge_foods
"""

import json
import sys
from pathlib import Path

from scripts.food_catalog.taxonomy import TAXONOMY

BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
BATCHES_DIR = Path(__file__).resolve().parent / "batches"
OUTPUT_PATH = BACKEND_ROOT / "app" / "data" / "foods_es_seed.json"

REQUIRED_FIELDS = (
    "slug",
    "name",
    "category",
    "subcategory",
    "unit_amount",
    "unit_type",
    "calories",
    "protein_g",
    "carbs_g",
    "sugars_g",
    "fat_g",
    "saturated_fat_g",
    "fiber_g",
    "salt_g",
)

NUMERIC_FIELDS = tuple(
    field for field in REQUIRED_FIELDS[4:] if field != "unit_type"
)

# EU labelling energy factors: carbs here are the available ones (fibre is a
# separate field worth 2 kcal/g). The tolerance is wide on purpose — the check
# is meant to catch a misplaced decimal point, not honest rounding.
CALORIE_TOLERANCE = 0.20
MIN_CALORIES_FOR_CHECK = 20


def _check_entry(entry: dict, origin: str) -> list[str]:
    problems = []
    slug = entry.get("slug", "<sin slug>")

    for field in REQUIRED_FIELDS:
        if entry.get(field) is None:
            problems.append(f"{origin}:{slug} le falta '{field}'")

    if problems:
        return problems

    for field in NUMERIC_FIELDS:
        if not isinstance(entry[field], (int, float)):
            problems.append(f"{origin}:{slug} '{field}' no es un número")
        elif entry[field] < 0:
            problems.append(f"{origin}:{slug} '{field}' es negativo")

    if problems:
        return problems

    category = entry["category"]
    if category not in TAXONOMY:
        problems.append(f"{origin}:{slug} categoría desconocida '{category}'")
    elif entry["subcategory"] not in TAXONOMY[category]:
        problems.append(
            f"{origin}:{slug} subcategoría '{entry['subcategory']}' "
            f"no pertenece a '{category}'"
        )

    if entry["unit_amount"] <= 0:
        problems.append(f"{origin}:{slug} 'unit_amount' debe ser mayor que cero")

    if entry["sugars_g"] > entry["carbs_g"]:
        problems.append(f"{origin}:{slug} azúcares ({entry['sugars_g']}) > hidratos")
    if entry["saturated_fat_g"] > entry["fat_g"]:
        problems.append(
            f"{origin}:{slug} saturadas ({entry['saturated_fat_g']}) > grasa"
        )

    calories = entry["calories"]
    if calories >= MIN_CALORIES_FOR_CHECK:
        expected = (
            4 * entry["protein_g"]
            + 4 * entry["carbs_g"]
            + 9 * entry["fat_g"]
            + 2 * entry["fiber_g"]
            + 7 * entry.get("alcohol_g", 0)
        )
        if abs(expected - calories) > calories * CALORIE_TOLERANCE:
            problems.append(
                f"{origin}:{slug} las kcal no cuadran con las macros "
                f"({calories} declaradas, ~{expected:.0f} calculadas)"
            )

    return problems


def main() -> int:
    batch_paths = sorted(BATCHES_DIR.glob("batch_*.json"))
    if not batch_paths:
        print(f"No hay lotes en {BATCHES_DIR}", file=sys.stderr)
        return 1

    merged: list[dict] = []
    seen_slugs: dict[str, str] = {}
    problems: list[str] = []

    for path in batch_paths:
        entries = json.loads(path.read_text(encoding="utf-8"))
        for entry in entries:
            problems.extend(_check_entry(entry, path.name))
            slug = entry.get("slug")
            if slug in seen_slugs:
                problems.append(
                    f"{path.name}:{slug} slug duplicado "
                    f"(ya estaba en {seen_slugs[slug]})"
                )
            elif slug:
                seen_slugs[slug] = path.name
            merged.append(entry)

    if problems:
        print(f"{len(problems)} problemas encontrados, no se escribe nada:\n")
        for problem in problems:
            print(f"  - {problem}")
        return 1

    # alcohol_g only exists to make the energy check add up on wine and beer;
    # it is not part of the label the app stores.
    for entry in merged:
        entry.pop("alcohol_g", None)

    merged.sort(
        key=lambda entry: (entry["category"], entry["subcategory"], entry["name"])
    )
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(merged, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    by_category: dict[str, int] = {}
    for entry in merged:
        by_category[entry["category"]] = by_category.get(entry["category"], 0) + 1

    print(f"{len(merged)} alimentos escritos en {OUTPUT_PATH}")
    for category, count in sorted(by_category.items()):
        print(f"  {category}: {count}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

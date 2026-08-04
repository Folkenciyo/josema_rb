import io
from pathlib import Path

from docx import Document
from docx.shared import Inches
from docx.table import Table

from app.schemas.export import DietPlanDocument, TrainingPlanDocument
from app.services.meal_template_service import NUTRIENT_FIELDS

STATIC_IMAGES_DIR = (
    Path(__file__).resolve().parent.parent / "static" / "exercise-images"
)

NUTRIENT_HEADERS = [
    "Kcal",
    "Proteína",
    "Hidratos",
    "Azúcares",
    "Grasa",
    "Saturadas",
    "Fibra",
    "Sal",
]


def _add_table(doc: Document, headers: list[str]) -> Table:
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = "Light Grid Accent 1"
    for cell, header in zip(table.rows[0].cells, headers, strict=True):
        cell.text = header
    return table


def render_training_plan_docx(document: TrainingPlanDocument) -> bytes:
    doc = Document()
    doc.add_heading(document.plan_title, level=0)
    subtitle = f"Cliente: {document.client_name}"
    if document.start_date:
        subtitle += f" · Desde {document.start_date}"
    if document.end_date:
        subtitle += f" hasta {document.end_date}"
    doc.add_paragraph(subtitle)
    if document.plan_notes:
        doc.add_paragraph(document.plan_notes)

    for week in document.weeks:
        doc.add_heading(f"Semana {week.week_number}", level=1)
        if week.notes:
            doc.add_paragraph(week.notes)
        for day in week.days:
            doc.add_heading(day.day_of_week_es, level=2)
            if not day.exercises:
                doc.add_paragraph("Descanso")
                continue

            table = _add_table(
                doc, ["Ejercicio", "Series", "Reps", "Descanso", "Notas"]
            )
            for exercise in day.exercises:
                row = table.add_row().cells
                row[0].text = exercise.name_es
                row[1].text = str(exercise.sets)
                row[2].text = exercise.reps
                row[3].text = (
                    f"{exercise.rest_seconds}s" if exercise.rest_seconds else ""
                )
                row[4].text = exercise.notes or ""

                if exercise.image_path:
                    image_path = STATIC_IMAGES_DIR / exercise.image_path
                    if image_path.exists():
                        doc.add_picture(str(image_path), width=Inches(1.5))

    buffer = io.BytesIO()
    doc.save(buffer)
    return buffer.getvalue()


def render_diet_plan_docx(document: DietPlanDocument) -> bytes:
    doc = Document()
    doc.add_heading(document.plan_title, level=0)
    subtitle = f"Cliente: {document.client_name}"
    if document.start_date:
        subtitle += f" · Desde {document.start_date}"
    if document.end_date:
        subtitle += f" hasta {document.end_date}"
    doc.add_paragraph(subtitle)

    if document.daily_calories_target:
        targets = [f"{document.daily_calories_target} kcal"]
        if document.daily_protein_g:
            targets.append(f"{document.daily_protein_g} g proteína")
        if document.daily_carbs_g:
            targets.append(f"{document.daily_carbs_g} g hidratos")
        if document.daily_fat_g:
            targets.append(f"{document.daily_fat_g} g grasa")
        doc.add_paragraph("Objetivo diario: " + " · ".join(targets))

    if document.plan_notes:
        doc.add_paragraph(document.plan_notes)

    for week in document.weeks:
        doc.add_heading(f"Semana {week.week_number}", level=1)
        if week.notes:
            doc.add_paragraph(week.notes)
        for day in week.days:
            heading = day.day_of_week_es
            if day.menu_name:
                heading += f" — {day.menu_name}"
            doc.add_heading(heading, level=2)

            if not day.meals:
                doc.add_paragraph("Sin menú asignado")
                continue

            for meal in day.meals:
                meal_heading = meal.name
                if meal.time_of_day:
                    meal_heading += f" ({meal.time_of_day})"
                doc.add_heading(meal_heading, level=3)

                table = _add_table(doc, ["Alimento", "Cantidad", *NUTRIENT_HEADERS])
                for item in meal.items:
                    row = table.add_row().cells
                    row[0].text = item.food_name
                    row[1].text = item.quantity_label or ""
                    for offset, field in enumerate(NUTRIENT_FIELDS, start=2):
                        value = getattr(item, field)
                        row[offset].text = str(value) if value is not None else ""

                total_row = table.add_row().cells
                total_row[0].text = "Total de la comida"
                for offset, field in enumerate(NUTRIENT_FIELDS, start=2):
                    total_row[offset].text = str(getattr(meal.totals, field))

            if day.totals:
                doc.add_paragraph(
                    f"Total del día: {day.totals.calories} kcal · "
                    f"{day.totals.protein_g} g proteína · "
                    f"{day.totals.carbs_g} g hidratos "
                    f"({day.totals.sugars_g} g azúcares) · "
                    f"{day.totals.fat_g} g grasa "
                    f"({day.totals.saturated_fat_g} g saturadas) · "
                    f"{day.totals.fiber_g} g fibra · {day.totals.salt_g} g sal"
                )

    buffer = io.BytesIO()
    doc.save(buffer)
    return buffer.getvalue()

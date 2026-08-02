import uuid

from sqlalchemy.orm import Session

from app.models import DietPlan, TrainingPlan
from app.schemas.export import (
    DietPlanDocument,
    ExportDietDay,
    ExportDietWeek,
    ExportMeal,
    ExportMealItem,
    ExportTrainingDay,
    ExportTrainingExercise,
    ExportTrainingWeek,
    TrainingPlanDocument,
)
from app.services import (
    client_service,
    diet_plan_service,
    meal_template_service,
    menu_service,
    training_plan_service,
)

DAY_LABELS_ES = {
    "monday": "Lunes",
    "tuesday": "Martes",
    "wednesday": "Miércoles",
    "thursday": "Jueves",
    "friday": "Viernes",
    "saturday": "Sábado",
    "sunday": "Domingo",
}


def _as_float(value: float | None) -> float | None:
    return float(value) if value is not None else None


def build_training_plan_document(
    db: Session, plan_id: uuid.UUID
) -> TrainingPlanDocument:
    plan: TrainingPlan = training_plan_service.get_plan(db, plan_id)
    client = client_service.get_client(db, plan.client_id)

    weeks = []
    for week in plan.weeks:
        days = []
        for day in week.days:
            exercises = [
                ExportTrainingExercise(
                    name_es=training_day_exercise.exercise.name_es,
                    sets=training_day_exercise.sets,
                    reps=training_day_exercise.reps,
                    rest_seconds=training_day_exercise.rest_seconds,
                    tempo=training_day_exercise.tempo,
                    notes=training_day_exercise.notes,
                    image_path=(
                        training_day_exercise.exercise.images[0]
                        if training_day_exercise.exercise.images
                        else None
                    ),
                )
                for training_day_exercise in day.exercises
            ]
            days.append(
                ExportTrainingDay(
                    day_of_week_es=DAY_LABELS_ES[day.day_of_week],
                    exercises=exercises,
                )
            )
        weeks.append(
            ExportTrainingWeek(
                week_number=week.week_number, notes=week.notes, days=days
            )
        )

    return TrainingPlanDocument(
        client_name=client.full_name,
        plan_title=plan.title,
        plan_notes=plan.notes,
        start_date=plan.start_date.isoformat() if plan.start_date else None,
        end_date=plan.end_date.isoformat() if plan.end_date else None,
        weeks=weeks,
    )


def build_diet_plan_document(db: Session, plan_id: uuid.UUID) -> DietPlanDocument:
    plan: DietPlan = diet_plan_service.get_plan(db, plan_id)
    client = client_service.get_client(db, plan.client_id)

    weeks = []
    for week in plan.weeks:
        days = []
        for day in week.days:
            meals = []
            if day.menu is not None:
                for menu_meal in day.menu.meals:
                    meal_template = menu_meal.meal_template
                    items = [
                        ExportMealItem(
                            food_name=item.food_name,
                            quantity_label=item.quantity_label,
                            calories=_as_float(item.calories),
                            protein_g=_as_float(item.protein_g),
                            carbs_g=_as_float(item.carbs_g),
                            fat_g=_as_float(item.fat_g),
                        )
                        for item in meal_template.items
                    ]
                    meals.append(
                        ExportMeal(
                            name=meal_template.name,
                            time_of_day=(
                                menu_meal.time_of_day.strftime("%H:%M")
                                if menu_meal.time_of_day
                                else None
                            ),
                            items=items,
                            totals=meal_template_service.compute_totals(meal_template),
                        )
                    )
            days.append(
                ExportDietDay(
                    day_of_week_es=DAY_LABELS_ES[day.day_of_week],
                    menu_name=day.menu.name if day.menu else None,
                    meals=meals,
                    totals=menu_service.compute_totals(day.menu) if day.menu else None,
                )
            )
        weeks.append(
            ExportDietWeek(week_number=week.week_number, notes=week.notes, days=days)
        )

    return DietPlanDocument(
        client_name=client.full_name,
        plan_title=plan.title,
        plan_notes=plan.notes,
        start_date=plan.start_date.isoformat() if plan.start_date else None,
        end_date=plan.end_date.isoformat() if plan.end_date else None,
        daily_calories_target=_as_float(plan.daily_calories_target),
        daily_protein_g=_as_float(plan.daily_protein_g),
        daily_carbs_g=_as_float(plan.daily_carbs_g),
        daily_fat_g=_as_float(plan.daily_fat_g),
        weeks=weeks,
    )

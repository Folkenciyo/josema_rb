from pydantic import BaseModel

from app.schemas.meal_template import MacroTotals


class ExportTrainingExercise(BaseModel):
    name_es: str
    sets: int
    reps: str
    rest_seconds: int | None
    tempo: str | None
    notes: str | None
    image_path: str | None


class ExportTrainingDay(BaseModel):
    day_of_week_es: str
    exercises: list[ExportTrainingExercise]


class ExportTrainingWeek(BaseModel):
    week_number: int
    notes: str | None
    days: list[ExportTrainingDay]


class TrainingPlanDocument(BaseModel):
    client_name: str
    plan_title: str
    plan_notes: str | None
    start_date: str | None
    end_date: str | None
    weeks: list[ExportTrainingWeek]


class ExportMealItem(BaseModel):
    food_name: str
    quantity_label: str | None
    calories: float | None
    protein_g: float | None
    carbs_g: float | None
    sugars_g: float | None
    fat_g: float | None
    saturated_fat_g: float | None
    fiber_g: float | None
    salt_g: float | None


class ExportMeal(BaseModel):
    name: str
    time_of_day: str | None
    items: list[ExportMealItem]
    totals: MacroTotals


class ExportDietDay(BaseModel):
    day_of_week_es: str
    menu_name: str | None
    meals: list[ExportMeal]
    totals: MacroTotals | None


class ExportDietWeek(BaseModel):
    week_number: int
    notes: str | None
    days: list[ExportDietDay]


class DietPlanDocument(BaseModel):
    client_name: str
    plan_title: str
    plan_notes: str | None
    start_date: str | None
    end_date: str | None
    daily_calories_target: float | None
    daily_protein_g: float | None
    daily_carbs_g: float | None
    daily_fat_g: float | None
    weeks: list[ExportDietWeek]

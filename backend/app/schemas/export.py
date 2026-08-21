from datetime import date

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


class ProgressSide(BaseModel):
    """One end of the comparison: a photo date and the weight around it."""

    taken_on: date
    weight_kg: float | None
    # May differ from taken_on: it is the nearest weigh-in, not necessarily the
    # same day, and the document says so.
    weight_measured_on: date | None
    bmi: float | None


class ProgressRow(BaseModel):
    pose_label_es: str
    before_image: str | None
    after_image: str | None


class ProgressZone(BaseModel):
    """One tape spot on both dates. A blank end is a spot that was not measured."""

    label_es: str
    before_cm: float | None
    after_cm: float | None
    delta_cm: float | None


class ProgressDocument(BaseModel):
    client_name: str
    before: ProgressSide
    after: ProgressSide
    weight_delta_kg: float | None
    rows: list[ProgressRow]
    # Only the zones with a reading on at least one of the two dates: the rest
    # would be a table of dashes.
    zones: list[ProgressZone] = []
    # The days those readings are from, which need not be the photo days.
    zones_before_on: date | None = None
    zones_after_on: date | None = None

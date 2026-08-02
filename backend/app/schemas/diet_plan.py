import uuid
from datetime import date

from pydantic import BaseModel

from app.models.training_plan import DayOfWeek, PlanStatus
from app.schemas.meal_template import MacroTotals
from app.schemas.menu import MenuSummaryOut


class DietPlanCreate(BaseModel):
    title: str
    notes: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: PlanStatus = PlanStatus.DRAFT
    daily_calories_target: float | None = None
    daily_protein_g: float | None = None
    daily_carbs_g: float | None = None
    daily_fat_g: float | None = None


class DietPlanUpdate(BaseModel):
    title: str | None = None
    notes: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: PlanStatus | None = None
    daily_calories_target: float | None = None
    daily_protein_g: float | None = None
    daily_carbs_g: float | None = None
    daily_fat_g: float | None = None


class DietPlanOut(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    title: str
    notes: str | None
    start_date: date | None
    end_date: date | None
    status: PlanStatus
    daily_calories_target: float | None
    daily_protein_g: float | None
    daily_carbs_g: float | None
    daily_fat_g: float | None

    model_config = {"from_attributes": True}


class DietWeekCreate(BaseModel):
    week_number: int
    notes: str | None = None


class DietWeekOut(BaseModel):
    id: uuid.UUID
    week_number: int
    notes: str | None

    model_config = {"from_attributes": True}


class DietDayIn(BaseModel):
    day_of_week: DayOfWeek
    order_index: int
    menu_id: uuid.UUID | None = None


class DietDayOut(BaseModel):
    id: uuid.UUID
    day_of_week: DayOfWeek
    order_index: int
    menu: MenuSummaryOut | None
    totals: MacroTotals | None


class DietWeekDetailOut(DietWeekOut):
    days: list[DietDayOut]


class SetDietDaysRequest(BaseModel):
    days: list[DietDayIn]


class AssignMenuRequest(BaseModel):
    menu_id: uuid.UUID
    # None applies the menu to all 7 days of the week.
    days_of_week: list[DayOfWeek] | None = None


class DuplicateWeekRequest(BaseModel):
    week_number: int


class DietPlanDetailOut(DietPlanOut):
    weeks: list[DietWeekDetailOut]

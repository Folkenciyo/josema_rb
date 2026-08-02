import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Client, DayOfWeek, DietDay, DietPlan, DietWeek
from app.repositories import diet_plan_repository, menu_repository
from app.schemas.diet_plan import (
    AssignMenuRequest,
    DietDayIn,
    DietDayOut,
    DietPlanCreate,
    DietPlanDetailOut,
    DietPlanUpdate,
    DietWeekCreate,
    DietWeekDetailOut,
    SetDietDaysRequest,
)
from app.schemas.menu import MenuSummaryOut
from app.services import menu_service


def list_plans_for_client(db: Session, client_id: uuid.UUID) -> list[DietPlan]:
    return diet_plan_repository.list_by_client(db, client_id)


def get_plan(db: Session, plan_id: uuid.UUID) -> DietPlan:
    plan = diet_plan_repository.get_by_id(db, plan_id)
    if plan is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Diet plan not found"
        )
    return plan


def create_plan(db: Session, client: Client, data: DietPlanCreate) -> DietPlan:
    plan = DietPlan(client_id=client.id, **data.model_dump())
    return diet_plan_repository.create(db, plan)


def update_plan(db: Session, plan_id: uuid.UUID, data: DietPlanUpdate) -> DietPlan:
    plan = get_plan(db, plan_id)
    updates = data.model_dump(exclude_unset=True)
    return diet_plan_repository.update_fields(db, plan, updates)


def delete_plan(db: Session, plan_id: uuid.UUID) -> None:
    plan = get_plan(db, plan_id)
    diet_plan_repository.delete(db, plan)


def add_week(db: Session, plan_id: uuid.UUID, data: DietWeekCreate) -> DietWeek:
    plan = get_plan(db, plan_id)
    week = DietWeek(week_number=data.week_number, notes=data.notes)
    return diet_plan_repository.add_week(db, plan, week)


def _get_week(db: Session, week_id: uuid.UUID) -> DietWeek:
    week = diet_plan_repository.get_week(db, week_id)
    if week is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Diet week not found"
        )
    return week


def _build_day(db: Session, day_in: DietDayIn) -> DietDay:
    menu_id = None
    if day_in.menu_id is not None:
        menu = menu_repository.get_by_id(db, day_in.menu_id)
        if menu is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Menu {day_in.menu_id} not found",
            )
        menu_id = menu.id
    return DietDay(
        day_of_week=day_in.day_of_week, order_index=day_in.order_index, menu_id=menu_id
    )


def set_week_days(
    db: Session, week_id: uuid.UUID, data: SetDietDaysRequest
) -> DietWeek:
    week = _get_week(db, week_id)
    days = [_build_day(db, day_in) for day_in in data.days]
    return diet_plan_repository.replace_days(db, week, days)


def duplicate_week(db: Session, week_id: uuid.UUID, new_week_number: int) -> DietWeek:
    source_week = _get_week(db, week_id)
    plan = get_plan(db, source_week.diet_plan_id)

    new_week = DietWeek(week_number=new_week_number, notes=source_week.notes)
    new_week.days = [
        DietDay(
            day_of_week=day.day_of_week,
            order_index=day.order_index,
            menu_id=day.menu_id,
        )
        for day in source_week.days
    ]
    return diet_plan_repository.add_week(db, plan, new_week)


def assign_menu(db: Session, week_id: uuid.UUID, data: AssignMenuRequest) -> DietWeek:
    """Assign one menu to several days of the week in a single action.

    `days_of_week=None` applies it to all 7 days. Target days that do not exist
    yet are created, so this works on a week that has just been added.
    """
    week = _get_week(db, week_id)
    menu = menu_repository.get_by_id(db, data.menu_id)
    if menu is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Menu not found"
        )

    target_days = data.days_of_week if data.days_of_week else list(DayOfWeek)
    days_by_weekday = {day.day_of_week: day for day in week.days}

    for day_of_week in target_days:
        day = days_by_weekday.get(day_of_week)
        if day is None:
            day = DietDay(day_of_week=day_of_week, order_index=0)
            week.days.append(day)
            days_by_weekday[day_of_week] = day
        day.menu_id = menu.id

    _reindex_days(week)
    db.commit()
    db.refresh(week)
    return week


def _reindex_days(week: DietWeek) -> None:
    """Keep `order_index` following the natural weekday order."""
    weekday_order = {day: index for index, day in enumerate(DayOfWeek)}
    ordered = sorted(week.days, key=lambda day: weekday_order[day.day_of_week])
    for index, day in enumerate(ordered):
        day.order_index = index


def to_day_out(day: DietDay) -> DietDayOut:
    menu_summary = MenuSummaryOut.model_validate(day.menu) if day.menu else None
    totals = menu_service.compute_totals(day.menu) if day.menu else None
    return DietDayOut(
        id=day.id,
        day_of_week=day.day_of_week,
        order_index=day.order_index,
        menu=menu_summary,
        totals=totals,
    )


def to_week_out(week: DietWeek) -> DietWeekDetailOut:
    return DietWeekDetailOut(
        id=week.id,
        week_number=week.week_number,
        notes=week.notes,
        days=[to_day_out(day) for day in week.days],
    )


def to_plan_out(plan: DietPlan) -> DietPlanDetailOut:
    return DietPlanDetailOut(
        id=plan.id,
        client_id=plan.client_id,
        title=plan.title,
        notes=plan.notes,
        start_date=plan.start_date,
        end_date=plan.end_date,
        status=plan.status,
        daily_calories_target=plan.daily_calories_target,
        daily_protein_g=plan.daily_protein_g,
        daily_carbs_g=plan.daily_carbs_g,
        daily_fat_g=plan.daily_fat_g,
        weeks=[to_week_out(week) for week in plan.weeks],
    )

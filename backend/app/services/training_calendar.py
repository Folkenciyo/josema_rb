"""The month view of a client: what they trained against what was planned.

The sessions are facts — the client logged them from their link. The planned
days are a projection: a routine is written as "week 2, Wednesday", with no
dates anywhere, so turning it into a calendar takes one convention, spelled out
in `_planned_dates`.
"""

from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.models import Client, DayOfWeek, TrainingPlan
from app.repositories import training_plan_repository, workout_repository
from app.schemas.workout import TrainingCalendarDayOut, TrainingCalendarOut

# Monday is 0 here and in date.weekday(), which is what makes the arithmetic in
# _planned_dates hold.
WEEKDAY_INDEX: dict[DayOfWeek, int] = {
    DayOfWeek.MONDAY: 0,
    DayOfWeek.TUESDAY: 1,
    DayOfWeek.WEDNESDAY: 2,
    DayOfWeek.THURSDAY: 3,
    DayOfWeek.FRIDAY: 4,
    DayOfWeek.SATURDAY: 5,
    DayOfWeek.SUNDAY: 6,
}

# A month at a time is what the UI asks for; the cap is there so a hand-made
# request cannot make us project years of a routine in one go.
MAX_RANGE_DAYS = 366


def _monday_of(day: date) -> date:
    return day - timedelta(days=day.weekday())


def _planned_dates(plan: TrainingPlan) -> dict[date, int]:
    """Every date the routine asks for, with how many exercises that day has.

    The convention: **week 1 is the calendar week containing the plan's start
    date**, so "week 2, Wednesday" is the Wednesday seven days after that. Days
    that fall before the start date — the Monday of week 1 when the plan starts
    on a Wednesday — are left out, and so is anything past the end date. With no
    end date the plan simply runs out when its last week does.
    """
    if plan.start_date is None:
        return {}

    first_monday = _monday_of(plan.start_date)
    planned: dict[date, int] = {}

    for week in plan.weeks:
        for day in week.days:
            when = (
                first_monday
                + timedelta(weeks=week.week_number - 1)
                + timedelta(days=WEEKDAY_INDEX[day.day_of_week])
            )
            if when < plan.start_date:
                continue
            if plan.end_date is not None and when > plan.end_date:
                continue
            planned[when] = len(day.exercises)

    return planned


def build_calendar(
    db: Session, client: Client, *, since: date, until: date, today: date | None = None
) -> TrainingCalendarOut:
    """One entry per day that has something to show, plus the tally of the range.

    Days with neither a session nor a planned workout are simply absent: the
    calendar grid is drawn by the browser, which already knows the month.
    """
    sessions = {
        session.performed_on: session
        for session in reversed(workout_repository.list_for_client(db, client.id))
        if since <= session.performed_on <= until
    }

    plan = training_plan_repository.get_active_for_client(db, client.id)
    planned = _planned_dates(plan) if plan is not None else {}

    days = [
        TrainingCalendarDayOut(
            date=when,
            trained=when in sessions,
            planned=when in planned,
            session_id=sessions[when].id if when in sessions else None,
            set_count=len(sessions[when].sets) if when in sessions else None,
            exercise_count=planned.get(when),
        )
        for when in sorted(set(sessions) | {d for d in planned if since <= d <= until})
    ]

    planned_in_range = [when for when in planned if since <= when <= until]
    # Today is not a missed day until it is over, and next Friday is not one at
    # all: counting them would call a month in progress a failure.
    cutoff = today or date.today()

    return TrainingCalendarOut(
        days=days,
        trained_count=len(sessions),
        planned_count=len(planned_in_range),
        missed_count=len(
            [w for w in planned_in_range if w < cutoff and w not in sessions]
        ),
        plan_starts_on=plan.start_date if plan is not None else None,
        has_active_plan=plan is not None,
    )

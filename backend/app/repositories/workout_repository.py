import uuid
from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.models import WorkoutSession, WorkoutSet

_SETS_LOADER = selectinload(WorkoutSession.sets)


def list_for_client(
    db: Session, client_id: uuid.UUID, *, limit: int | None = None
) -> list[WorkoutSession]:
    query = (
        db.query(WorkoutSession)
        .options(_SETS_LOADER)
        .filter(WorkoutSession.client_id == client_id)
        .order_by(WorkoutSession.performed_on.desc(), WorkoutSession.created_at.desc())
    )
    return query.limit(limit).all() if limit else query.all()


def count_for_client(db: Session, client_id: uuid.UUID) -> int:
    """How many sessions there are, without loading a single set."""
    return (
        db.query(func.count(WorkoutSession.id))
        .filter(WorkoutSession.client_id == client_id)
        .scalar()
        or 0
    )


def get_by_device_id(
    db: Session, client_id: uuid.UUID, device_session_id: str
) -> WorkoutSession | None:
    """The retry check: the same phone session must never be stored twice."""
    return (
        db.query(WorkoutSession)
        .options(_SETS_LOADER)
        .filter(
            WorkoutSession.client_id == client_id,
            WorkoutSession.device_session_id == device_session_id,
        )
        .first()
    )


def get_by_id(
    db: Session, client_id: uuid.UUID, session_id: uuid.UUID
) -> WorkoutSession | None:
    return (
        db.query(WorkoutSession)
        .options(_SETS_LOADER)
        .filter(WorkoutSession.id == session_id, WorkoutSession.client_id == client_id)
        .first()
    )


def last_trained_per_day(db: Session, client_id: uuid.UUID) -> dict[uuid.UUID, date]:
    """When each day of the routine was last trained, for the list of days."""
    rows = (
        db.query(
            WorkoutSession.training_day_id,
            func.max(WorkoutSession.performed_on),
        )
        .filter(
            WorkoutSession.client_id == client_id,
            WorkoutSession.training_day_id.isnot(None),
        )
        .group_by(WorkoutSession.training_day_id)
        .all()
    )
    return {day_id: performed_on for day_id, performed_on in rows}


def last_sets_per_exercise(
    db: Session, client_id: uuid.UUID, exercise_ids: list[str]
) -> dict[str, tuple[date, list[WorkoutSet]]]:
    """What was lifted the last time each exercise was trained, on any day.

    Keyed by the catalogue exercise, so a lift done once a week carries over from
    one week of the routine (or one plan) to the next. Only the newest session
    that contains the exercise counts: older sets are never mixed in.
    """
    if not exercise_ids:
        return {}

    newest = (
        func.dense_rank()
        .over(
            partition_by=WorkoutSet.exercise_id,
            order_by=(
                WorkoutSession.performed_on.desc(),
                WorkoutSession.created_at.desc(),
                WorkoutSession.id,
            ),
        )
        .label("newest")
    )
    ranked = (
        db.query(WorkoutSet.id.label("set_id"), newest)
        .join(WorkoutSession, WorkoutSet.session_id == WorkoutSession.id)
        .filter(
            WorkoutSession.client_id == client_id,
            WorkoutSet.exercise_id.in_(exercise_ids),
        )
        .subquery()
    )
    rows = (
        db.query(WorkoutSet, WorkoutSession.performed_on)
        .join(ranked, ranked.c.set_id == WorkoutSet.id)
        .join(WorkoutSession, WorkoutSet.session_id == WorkoutSession.id)
        .filter(ranked.c.newest == 1)
        .order_by(WorkoutSet.set_number)
        .all()
    )

    last: dict[str, tuple[date, list[WorkoutSet]]] = {}
    for performed_set, performed_on in rows:
        last.setdefault(performed_set.exercise_id, (performed_on, []))[1].append(
            performed_set
        )
    return last


def list_trained_exercises(db: Session, client_id: uuid.UUID) -> list[tuple]:
    """Every exercise this client has actually logged, with how much of it.

    Sets whose exercise was deleted from the catalogue are left out: there would
    be nothing to open. Their sets are still readable inside the session.
    """
    return (
        db.query(
            WorkoutSet.exercise_id,
            func.max(WorkoutSet.exercise_name),
            func.count(func.distinct(WorkoutSession.id)),
            func.max(WorkoutSession.performed_on),
            func.max(WorkoutSet.weight_kg),
        )
        .join(WorkoutSession, WorkoutSet.session_id == WorkoutSession.id)
        .filter(
            WorkoutSession.client_id == client_id,
            WorkoutSet.exercise_id.isnot(None),
        )
        .group_by(WorkoutSet.exercise_id)
        .order_by(func.max(WorkoutSession.performed_on).desc())
        .all()
    )


def list_sets_for_exercise(
    db: Session, client_id: uuid.UUID, exercise_id: str
) -> list[tuple[uuid.UUID, date, WorkoutSet]]:
    """Every set of one exercise across every plan, oldest first: the progression.

    The session id travels with each set because two sessions can share a day —
    a double session is two points on the chart, not one.
    """
    return (
        db.query(WorkoutSession.id, WorkoutSession.performed_on, WorkoutSet)
        .join(WorkoutSet, WorkoutSet.session_id == WorkoutSession.id)
        .filter(
            WorkoutSession.client_id == client_id,
            WorkoutSet.exercise_id == exercise_id,
        )
        .order_by(WorkoutSession.performed_on.asc(), WorkoutSession.created_at.asc())
        .all()
    )


def create(db: Session, session: WorkoutSession) -> WorkoutSession:
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

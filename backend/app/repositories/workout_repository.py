import uuid
from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.models import WorkoutSession, WorkoutSet

_SETS_LOADER = selectinload(WorkoutSession.sets)
# Only the most recent session of a day is ever shown as "last time".
_RECENT_SESSIONS = 5


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
    db: Session, client_id: uuid.UUID, day_id: uuid.UUID
) -> dict[uuid.UUID, tuple[date, list[WorkoutSet]]]:
    """What was lifted the last time each exercise of this day was trained.

    Keyed by the exercise of the plan, so exercises the trainer has added since
    simply come back empty instead of borrowing someone else's numbers.
    """
    sessions = (
        db.query(WorkoutSession)
        .options(_SETS_LOADER)
        .filter(
            WorkoutSession.client_id == client_id,
            WorkoutSession.training_day_id == day_id,
        )
        .order_by(WorkoutSession.performed_on.desc(), WorkoutSession.created_at.desc())
        .limit(_RECENT_SESSIONS)
        .all()
    )

    last: dict[uuid.UUID, tuple[date, list[WorkoutSet]]] = {}
    source: dict[uuid.UUID, uuid.UUID] = {}

    for session in sessions:
        for performed_set in session.sets:
            key = performed_set.training_day_exercise_id
            if key is None:
                continue
            if key not in last:
                last[key] = (session.performed_on, [])
                source[key] = session.id
            # Sets from an older session must not be mixed into the newest one.
            if source[key] == session.id:
                last[key][1].append(performed_set)

    return last


def list_sets_for_exercise(
    db: Session, client_id: uuid.UUID, exercise_id: str
) -> list[tuple[date, WorkoutSet]]:
    """Every set of one exercise across every plan, oldest first: the progression."""
    return (
        db.query(WorkoutSession.performed_on, WorkoutSet)
        .join(WorkoutSet, WorkoutSet.session_id == WorkoutSession.id)
        .filter(
            WorkoutSession.client_id == client_id,
            WorkoutSet.exercise_id == exercise_id,
        )
        .order_by(WorkoutSession.performed_on.asc())
        .all()
    )


def create(db: Session, session: WorkoutSession) -> WorkoutSession:
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

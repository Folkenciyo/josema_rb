"""Which message the queue is showing on a given day.

Still computed, not stored: no scheduling table and no nightly job. What changed
is that the queue is common to every client — the trainer picks the order and
which one is showing today, so "the active one" and "the next one" mean
something. Before, each client was shifted to a different point of the library
by their own id.

The anchor is a pair: a message and the day it was put up. Every day after that
moves one step down the order, wrapping around at the end.
"""

import uuid
from datetime import date


def _anchor_index(quote_ids: list[uuid.UUID], anchor_id: uuid.UUID | None) -> int:
    """Where the queue was pinned, or its start if that message is gone."""
    if anchor_id is None:
        return 0
    try:
        return quote_ids.index(anchor_id)
    except ValueError:
        return 0


def index_for_day(
    quote_ids: list[uuid.UUID],
    *,
    today: date,
    anchor_id: uuid.UUID | None,
    anchor_date: date | None,
) -> int | None:
    """Position in the queue for `today`, or None on an empty library.

    `quote_ids` must arrive in the trainer's order (the repository sorts by
    position) or the message would jump between two requests on the same day.
    """
    if not quote_ids:
        return None

    if anchor_date is None:
        # Never pinned: the queue starts at its first message and walks from a
        # fixed day, so the choice is still stable across restarts.
        anchor_date = date(2026, 1, 1)

    elapsed = (today - anchor_date).days
    return (_anchor_index(quote_ids, anchor_id) + elapsed) % len(quote_ids)


def pick_for_day(
    quote_ids: list[uuid.UUID],
    *,
    today: date,
    anchor_id: uuid.UUID | None,
    anchor_date: date | None,
) -> uuid.UUID | None:
    index = index_for_day(
        quote_ids, today=today, anchor_id=anchor_id, anchor_date=anchor_date
    )
    return None if index is None else quote_ids[index]

"""Picks which message a client sees today.

The choice is computed, not stored: the day plus the client decide an index into
the library. That means no scheduling table and no nightly job, the portal shows
the same message all day however many times it is opened, and two clients opening
their portal on the same morning generally get different messages.

Adding or removing a quote reshuffles what everyone sees, which is fine: nobody
is promised a particular message on a particular day.
"""

import uuid
from datetime import date


def pick_for_day(quote_ids: list[uuid.UUID], client_id: uuid.UUID, today: date):
    """Return the quote id for this client today, or None on an empty library.

    `quote_ids` must arrive in a stable order (the repository sorts by creation
    date) or the message would change between two requests on the same day.
    """
    if not quote_ids:
        return None

    # `toordinal` advances by one a day; the client's int shifts each person to a
    # different point in the cycle so they are not all reading the same line.
    offset = today.toordinal() + client_id.int
    return quote_ids[offset % len(quote_ids)]

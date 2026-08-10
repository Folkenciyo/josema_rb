import time
from collections import defaultdict, deque


class SlidingWindowLimiter:
    """In-memory attempt counter over a moving time window.

    What counts as an attempt is up to the caller: the token guard only records
    the failures, the write guard records every accepted write.

    The API runs as a single container, so keeping this in process is enough;
    if it ever scales horizontally this has to move to Redis, because each
    replica would otherwise count on its own.
    """

    def __init__(self, *, max_attempts: int, window_seconds: int) -> None:
        self._max_attempts = max_attempts
        self._window_seconds = window_seconds
        self._attempts: dict[str, deque[float]] = defaultdict(deque)

    def is_blocked(self, key: str) -> bool:
        return len(self._recent(key)) >= self._max_attempts

    def record_attempt(self, key: str) -> None:
        self._recent(key).append(time.monotonic())

    def reset(self, key: str | None = None) -> None:
        if key is None:
            self._attempts.clear()
        else:
            self._attempts.pop(key, None)

    def _recent(self, key: str) -> deque[float]:
        attempts = self._attempts[key]
        cutoff = time.monotonic() - self._window_seconds
        while attempts and attempts[0] < cutoff:
            attempts.popleft()
        return attempts

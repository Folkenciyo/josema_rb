from pydantic import BaseModel


class SearchHit(BaseModel):
    """A single thing the trainer can jump to, already reduced to what is shown."""

    id: str
    label: str
    detail: str | None = None


class SearchResults(BaseModel):
    clients: list[SearchHit]
    exercises: list[SearchHit]
    foods: list[SearchHit]
    meals: list[SearchHit]
    menus: list[SearchHit]

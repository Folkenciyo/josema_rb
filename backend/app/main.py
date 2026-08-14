import logging
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.alerts import router as alerts_router
from app.api.auth import router as auth_router
from app.api.clients import router as clients_router
from app.api.diet_plans import router as diet_plans_router
from app.api.exercises import router as exercises_router
from app.api.foods import router as foods_router
from app.api.meal_templates import router as meal_templates_router
from app.api.measurements import router as measurements_router
from app.api.menus import router as menus_router
from app.api.photos import router as photos_router
from app.api.portal import router as portal_router
from app.api.questionnaire import router as questionnaire_router
from app.api.quotes import router as quotes_router
from app.api.search import router as search_router
from app.api.settings import router as settings_router
from app.api.training_plans import router as training_plans_router
from app.api.workouts import router as workouts_router
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(title="JOSEMA RB API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_IMAGES_DIR = Path(__file__).resolve().parent / "static" / "exercise-images"
STATIC_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
app.mount(
    "/static/exercise-images",
    StaticFiles(directory=STATIC_IMAGES_DIR),
    name="exercise-images",
)

# Motivational images are public on purpose: the portal is opened by a token,
# not a session, and the same picture is shown to every client.
QUOTE_IMAGES_DIR = Path(__file__).resolve().parent / "static" / "quote-images"
QUOTE_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
app.mount(
    "/static/quote-images",
    StaticFiles(directory=QUOTE_IMAGES_DIR),
    name="quote-images",
)

logger = logging.getLogger("app.validation")


@app.exception_handler(RequestValidationError)
async def log_validation_error(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """A 422 with no trace is impossible to debug from a phone in a gym.

    Only the field and the kind of error are logged — never the value, which
    could be a client's own data.
    """
    logger.warning(
        "422 on %s %s: %s",
        request.method,
        request.url.path,
        [
            {
                "field": ".".join(str(part) for part in error["loc"]),
                "type": error["type"],
            }
            for error in exc.errors()
        ],
    )
    # `jsonable_encoder` because a validation error can carry values FastAPI's
    # own encoder handles but `json.dumps` does not.
    return JSONResponse(
        status_code=422, content=jsonable_encoder({"detail": exc.errors()})
    )


app.include_router(auth_router)
app.include_router(alerts_router)
app.include_router(settings_router)
app.include_router(questionnaire_router)
app.include_router(clients_router)
app.include_router(portal_router)
app.include_router(measurements_router)
app.include_router(photos_router)
app.include_router(exercises_router)
app.include_router(foods_router)
app.include_router(quotes_router)
app.include_router(meal_templates_router)
app.include_router(menus_router)
app.include_router(training_plans_router)
app.include_router(diet_plans_router)
app.include_router(workouts_router)
app.include_router(search_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

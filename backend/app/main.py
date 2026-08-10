from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
from app.api.settings import router as settings_router
from app.api.training_plans import router as training_plans_router
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

app.include_router(auth_router)
app.include_router(alerts_router)
app.include_router(settings_router)
app.include_router(clients_router)
app.include_router(portal_router)
app.include_router(measurements_router)
app.include_router(photos_router)
app.include_router(exercises_router)
app.include_router(foods_router)
app.include_router(meal_templates_router)
app.include_router(menus_router)
app.include_router(training_plans_router)
app.include_router(diet_plans_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

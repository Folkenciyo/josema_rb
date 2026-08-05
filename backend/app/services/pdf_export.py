from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.schemas.export import (
    DietPlanDocument,
    ProgressDocument,
    TrainingPlanDocument,
)
from app.services.photo_storage import MEDIA_ROOT

TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates" / "pdf"
# Relative image paths in the templates (e.g. "Bent_Press/0.jpg") resolve
# against this base when WeasyPrint fetches them.
STATIC_IMAGES_DIR = (
    Path(__file__).resolve().parent.parent / "static" / "exercise-images"
)

_env = Environment(
    loader=FileSystemLoader(TEMPLATES_DIR),
    autoescape=select_autoescape(["html"]),
)


def render_training_plan_pdf(document: TrainingPlanDocument) -> bytes:
    # Imported lazily: WeasyPrint binds to native Pango/Cairo/GDK-Pixbuf
    # libraries at import time, which aren't available on every dev machine
    # (only inside the Docker image, where the Dockerfile installs them).
    from weasyprint import HTML

    template = _env.get_template("training_plan.html")
    html = template.render(doc=document)
    return HTML(string=html, base_url=str(STATIC_IMAGES_DIR)).write_pdf()


def render_diet_plan_pdf(document: DietPlanDocument) -> bytes:
    from weasyprint import HTML

    template = _env.get_template("diet_plan.html")
    html = template.render(doc=document)
    return HTML(string=html, base_url=str(STATIC_IMAGES_DIR)).write_pdf()


def render_progress_pdf(document: ProgressDocument) -> bytes:
    from weasyprint import HTML

    template = _env.get_template("progress.html")
    html = template.render(doc=document)
    # Photos are stored outside static/, so this render resolves against the
    # media root instead.
    return HTML(string=html, base_url=str(MEDIA_ROOT)).write_pdf()

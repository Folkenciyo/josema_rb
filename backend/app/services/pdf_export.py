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
# The brand assets live elsewhere, so the templates reference them through an
# absolute file:// URL instead of the relative base above.
BRAND_URL = (Path(__file__).resolve().parent.parent / "static" / "brand").as_uri()

_env = Environment(
    loader=FileSystemLoader(TEMPLATES_DIR),
    autoescape=select_autoescape(["html"]),
)


def _render(
    template_name: str, document: object, *, base_url: Path = STATIC_IMAGES_DIR
) -> bytes:
    # Imported lazily: WeasyPrint binds to native Pango/Cairo/GDK-Pixbuf
    # libraries at import time, which aren't available on every dev machine
    # (only inside the Docker image, where the Dockerfile installs them).
    from weasyprint import HTML

    template = _env.get_template(template_name)
    html = template.render(doc=document, brand=BRAND_URL)
    return HTML(string=html, base_url=str(base_url)).write_pdf()


def render_training_plan_pdf(document: TrainingPlanDocument) -> bytes:
    return _render("training_plan.html", document)


def render_diet_plan_pdf(document: DietPlanDocument) -> bytes:
    return _render("diet_plan.html", document)


def render_progress_pdf(document: ProgressDocument) -> bytes:
    # Photos are stored outside static/, so this one resolves its images
    # against the media root instead.
    return _render("progress.html", document, base_url=MEDIA_ROOT)

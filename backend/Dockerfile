FROM python:3.12-slim

WORKDIR /app

# Native libraries required by WeasyPrint to render PDFs (Pango/Cairo text
# layout and image decoding). Not needed by python-docx or the rest of the app.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libcairo2 \
    libffi-dev \
    shared-mime-info \
    fonts-liberation \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Exercise images (~99 MB) are not in git, so they are baked in at build time from
# free-exercise-db (Unlicense). One tarball instead of ~1500 single-file requests.
RUN mkdir -p app/static/exercise-images \
    && curl -fsSL https://github.com/yuhonas/free-exercise-db/archive/refs/heads/main.tar.gz \
    -o /tmp/free-exercise-db.tar.gz \
    && tar -xzf /tmp/free-exercise-db.tar.gz -C app/static/exercise-images \
    --strip-components=2 free-exercise-db-main/exercises \
    && find app/static/exercise-images -name "*.json" -delete \
    && rm /tmp/free-exercise-db.tar.gz

RUN pip install --no-cache-dir uv

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

COPY alembic.ini ./
COPY app ./app
COPY scripts ./scripts
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["./docker-entrypoint.sh"]

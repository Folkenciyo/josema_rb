#!/bin/sh
set -e

# Every step below is idempotent, so a redeploy or a container restart is safe.
echo "==> Applying database migrations"
uv run alembic upgrade head

echo "==> Seeding the exercise library (upsert)"
uv run python -m scripts.seed_exercises

echo "==> Seeding the trainer account (upsert from TRAINER_EMAIL/TRAINER_PASSWORD)"
uv run python -m scripts.seed_trainer

# Runs after the trainer exists: seeded foods are owned by them, and stay
# editable and deletable like any food the trainer creates by hand.
echo "==> Seeding the food catalog (upsert)"
uv run python -m scripts.seed_foods

echo "==> Starting API"
exec uv run uvicorn app.main:app --host 0.0.0.0 --port 8000

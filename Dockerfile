FROM node:24-alpine AS frontend-build
WORKDIR /app/apps/frontend
COPY apps/frontend/package.json apps/frontend/package-lock.json ./
RUN npm ci
COPY apps/frontend ./
RUN npm run build

FROM python:3.12-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_CREATE=false \
    APP_ENV=production \
    PORT=3000

WORKDIR /app
RUN pip install --no-cache-dir poetry==2.4.1
COPY apps/backend/pyproject.toml apps/backend/poetry.lock ./apps/backend/
RUN poetry --directory apps/backend install --only main --no-root

COPY apps/backend ./apps/backend
COPY --from=frontend-build /app/apps/frontend/dist ./apps/frontend/dist

WORKDIR /app/apps/backend
EXPOSE 3000
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-3000} --workers ${WEB_CONCURRENCY:-2} wsgi:app"]

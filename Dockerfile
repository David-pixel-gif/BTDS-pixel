FROM node:20-bookworm-slim AS frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TF_CPP_MIN_LOG_LEVEL=2 \
    TF_ENABLE_ONEDNN_OPTS=0 \
    PORT=8080

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

COPY . .
COPY --from=frontend-build /app/frontend/build /app/frontend/build

WORKDIR /app/backend

CMD gunicorn --worker-tmp-dir /dev/shm --bind 0.0.0.0:${PORT} --workers ${WEB_CONCURRENCY:-1} --timeout ${GUNICORN_TIMEOUT:-180} app:app

# RA2

RA2 is a resume analysis app with a FastAPI backend, PostgreSQL, Redis, Qdrant, MinIO, and Celery workers. The current deployment runs these services inside one Docker container using Supervisor.

## What is running

The monolithic container starts:
- FastAPI API
- PostgreSQL
- Redis
- Qdrant
- MinIO
- Celery worker
- Celery beat

## Quick start

1. Make sure a root .env file exists in this project.
2. Build and start the container:

```bash
docker compose -f docker-compose.app.yml up -d --build
```

3. Verify the API:

```bash
curl -i http://127.0.0.1:7860/docs
```

4. Stop it when needed:

```bash
docker compose -f docker-compose.app.yml down
```

## Main URLs

- API docs: http://127.0.0.1:7860/docs
- OpenAPI schema: http://127.0.0.1:7860/openapi.json
- MinIO UI: http://127.0.0.1:9001

## Required environment variables

The app expects a root .env file with values such as:

```env
BACKEND_SECRETE_KEY=...
HASHING_ALGO=HS256

PG_DB_NAME=postgres
PG_DB_USER=shubham
PG_DB_PASSWORD=Sh7bh@m712
PG_DB_PORT=5432
PG_DB_HOST=127.0.0.1

MINIO_CLIENT_PORT=9000
MINIO_UI_PORT=9001
MINIO_ROOT_USER=shubham
MINIO_ROOT_PASSWORD=Sh7bh@m712
MINIO_HOST=127.0.0.1
MINIO_BUCKET_NAME=resume

QDRANT_HOST=127.0.0.1
QDRANT_PORT=6333

GEN_REDIS_HOST=127.0.0.1
GEN_REDIS_PORT=6379
GEN_REDIS_LOGICAL_DB=1

A_CELERY_REDIS_LOGICAL_DB=0
A_CELERY_BROKER=redis
A_CELERY_BROKER_HOST=127.0.0.1
A_CELERY_BROKER_PORT=6379
A_CELERY_BACKEND=redis
A_CELERY_BACKEND_HOST=127.0.0.1
A_CELERY_BACKEND_PORT=6379

REACT_APP_FRONTEND_HOST=https://analize-beta.vercel.app
```

## Useful commands

```bash
# Show container status
docker compose -f docker-compose.app.yml ps

# Follow logs
docker compose -f docker-compose.app.yml logs -f backend-monolith
```

## Notes

- This README reflects the current monolithic deployment in Docker Compose.
- The API is served on port 7860.
- The backend uses Alembic migrations automatically during startup.

## Troubleshooting

If the app does not start:

```bash
docker compose -f docker-compose.app.yml logs -f backend-monolith
```

Common causes are:
- missing or invalid values in .env
- PostgreSQL not ready yet during first boot
- stale container state after changing environment settings

If needed, recreate the container with:

```bash
docker compose -f docker-compose.app.yml down --remove-orphans
docker compose -f docker-compose.app.yml up -d --build
```

# Stage 1: Gather binaries from official source images
FROM minio/minio:latest AS minio-src
FROM qdrant/qdrant:latest AS qdrant-src

FROM ubuntu:24.04

LABEL maintainer="Monolith-Setup"

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    supervisor \
    curl \
    unzip \
    procps \
    ca-certificates \
    python3-pip \
    python3-venv \
    python3-dev \
    build-essential \
    postgresql-16 \
    postgresql-client-16 \
    redis-server \
    libunwind-dev \
    && rm -rf /var/lib/apt/lists/*


COPY --from=minio-src /usr/bin/minio /usr/bin/minio
COPY --from=qdrant-src /qdrant/qdrant /usr/bin/qdrant

WORKDIR /app

RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

RUN pip install --no-cache-dir --upgrade pip setuptools wheel

RUN pip install --no-cache-dir \
    "alembic>=1.18.4" \
    "asyncio>=4.0.0" \
    "asyncpg>=0.31.0" \
    "celery[redis]>=5.6.3" \
    "fastapi[standard]>=0.136.3" \
    "minio>=7.2.20" \
    "numpy>=2.4.6" \
    "psycopg[binary]>=3.3.4" \
    "pwdlib[argon2]>=0.3.0" \
    "pydantic>=2.13.4" \
    "pydantic-settings>=2.14.1" \
    "pyjwt>=2.13.0" \
    "pymupdf>=1.27.2.3" \
    "pypdf>=4.0.0" \
    "python-dotenv>=1.2.2" \
    "qdrant-client>=1.18.0" \
    "requests>=2.31.0" \
    "sqlalchemy>=2.0.50" \
    "structlog>=25.5.0" \
    "uvicorn>=0.48.0"

COPY Backend_Service/ ./Backend_Service/
COPY AI_Service/ ./AI_Service/
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
COPY .env /app/

RUN mkdir -p /data/postgres /data/redis /data/qdrant /data/minio /var/run/redis && \
    chown -R postgres:postgres /data/postgres && \
    chown -R redis:redis /data/redis /var/run/redis && \
    chmod -R 777 /data


    RUN su postgres -c "/usr/lib/postgresql/16/bin/initdb -D /data/postgres -E UTF8" && \
    su postgres -c "/usr/lib/postgresql/16/bin/postgres -D /data/postgres -k /tmp -p 5432 &" && \
    sleep 4 && \
    su postgres -c "psql -h localhost -p 5432 -U postgres -c \"CREATE USER admin WITH PASSWORD 'secure_password';\"" && \
    su postgres -c "psql -h localhost -p 5432 -U postgres -c \"CREATE DATABASE resume_db OWNER admin;\"" && \
    su postgres -c "/usr/lib/postgresql/16/bin/pg_ctl -D /data/postgres -m immediate stop"


COPY supervisord.conf /etc/supervisor/supervisord.conf

ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app:/app/Backend_Service:/app/AI_Service
ENV PG_DB_HOST=127.0.0.1
ENV PG_DB_PORT=5432
ENV MINIO_HOST=127.0.0.1
ENV QDRANT_HOST=127.0.0.1
ENV GEN_REDIS_HOST=127.0.0.1
ENV A_CELERY_BROKER_HOST=127.0.0.1
ENV A_CELERY_BACKEND_HOST=127.0.0.1
ENV REACT_APP_FRONTEND_HOST=http://127.0.0.1

# Expose FastAPI port (8000) and MinIO Console (9001) / S3 API (9000)
EXPOSE 7860 9000 9001

ENTRYPOINT ["/entrypoint.sh"]

# Boot everything via Supervisor
CMD ["supervisord", "-c", "/etc/supervisor/supervisord.conf"]

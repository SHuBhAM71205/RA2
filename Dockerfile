# Stage 1: Gather binaries from official source images
FROM minio/minio:latest AS minio-src
FROM qdrant/qdrant:latest AS qdrant-src

# Stage 2: Final Monolithic Build
FROM ubuntu:24.04

LABEL maintainer="Monolith-Setup"

# Prevent interactive prompts during apt install
ENV DEBIAN_FRONTEND=noninteractive

# Install PostgreSQL, Redis, Supervisor, Python, and base utilities
# Inside Stage 2 of your Dockerfile, update the apt block to look like this:
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


# Copy MinIO and Qdrant binaries from Stage 1
COPY --from=minio-src /usr/bin/minio /usr/bin/minio
COPY --from=qdrant-src /qdrant/qdrant /usr/bin/qdrant

# Set up project workspace
WORKDIR /app

# Setup Python Virtual Environment to avoid PEP 668 breaks
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Upgrade pip tools
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Install all Python dependencies
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

# Copy internal Python backend services
COPY Backend_Service/ ./Backend_Service/
COPY AI_Service/ ./AI_Service/
COPY .env /app/
# Set up data directories with appropriate permissions
RUN mkdir -p /data/postgres /data/redis /data/qdrant /data/minio /var/run/redis && \
    chown -R postgres:postgres /data/postgres && \
    chown -R redis:redis /data/redis /var/run/redis && \
    chmod -R 777 /data

# Initialize PostgreSQL database cluster
RUN su postgres -c "/usr/lib/postgresql/16/bin/initdb -D /data/postgres -E UTF8" && \
    su postgres -c "/usr/lib/postgresql/16/bin/postgres -D /data/postgres -k /tmp -p 5432 &" && \
    sleep 4 && \
    su postgres -c "psql -h localhost -p 5432 -U postgres -c \"CREATE USER admin WITH PASSWORD 'secure_password';\"" && \
    su postgres -c "psql -h localhost -p 5432 -U postgres -c \"CREATE DATABASE resume_db OWNER admin;\"" && \
    su postgres -c "/usr/lib/postgresql/16/bin/pg_ctl -D /data/postgres -m immediate stop"

# Copy supervisor master configuration file
COPY supervisord.conf /etc/supervisor/supervisord.conf

# Environment Variables pointing internally to localhost inside the same container
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app:/app/Backend_Service:/app/AI_Service
ENV QDRANT_HOST=localhost
ENV MINIO_HOST=localhost
ENV A_CELERY_BROKER_HOST=localhost
ENV A_CELERY_BACKEND_HOST=localhost

# Expose FastAPI port (8000) and MinIO Console (9001) / S3 API (9000)
EXPOSE 8000 9000 9001

# Boot everything via Supervisor
CMD ["supervisord", "-c", "/etc/supervisor/supervisord.conf"]

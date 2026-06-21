FROM python:3.13-slim

WORKDIR /app

# Install system dependencies (postgresql, redis, supervisor, curl, unzip, procps)
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql \
    postgresql-contrib \
    redis-server \
    supervisor \
    curl \
    unzip \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Download and install Qdrant binary
RUN curl -L -o qdrant.tar.gz https://github.com/qdrant/qdrant/releases/download/v1.10.1/qdrant-x86_64-unknown-linux-gnu.tar.gz && \
    tar -xzf qdrant.tar.gz -C /usr/local/bin/ && \
    rm qdrant.tar.gz

# Download and install MinIO binary
RUN curl -L -o /usr/local/bin/minio https://dl.min.io/server/minio/release/linux-amd64/minio && \
    chmod +x /usr/local/bin/minio

# Copy backend and AI services code
COPY Backend_Service/ ./Backend_Service/
COPY AI_Service/ ./AI_Service/

# Install python dependencies for both services
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

# Set up data directories with full access permissions (critical for non-root runtimes like HF Spaces)
RUN mkdir -p /data/postgres /data/redis /data/qdrant /data/minio && \
    chmod -R 777 /data /run

# Copy supervisor configuration file
COPY supervisord.app.conf /etc/supervisor/supervisord.conf

# Copy entrypoint script
COPY entrypoint.app.sh /app/entrypoint.app.sh
RUN chmod +x /app/entrypoint.app.sh

ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app:/app/Backend_Service:/app/AI_Service

# Only expose FastAPI port
EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.app.sh"]

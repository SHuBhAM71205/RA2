#!/bin/bash
set -e

# Define directories
DATA_DIR="/data"
PG_DATA="${DATA_DIR}/postgres"
REDIS_DATA="${DATA_DIR}/redis"
QDRANT_DATA="${DATA_DIR}/qdrant"
MINIO_DATA="${DATA_DIR}/minio"

echo "=== Initializing Self-Contained App Container Environment ==="

# Create necessary directories under /data
mkdir -p "$PG_DATA" "$REDIS_DATA" "$QDRANT_DATA" "$MINIO_DATA"

# 1. Initialize PostgreSQL if not already done
if [ ! -f "${PG_DATA}/PG_VERSION" ]; then
    echo "PostgreSQL data directory is empty. Initializing..."
    initdb -D "$PG_DATA" -U postgres --auth-local=trust --auth-host=trust
    
    echo "Starting temporary PostgreSQL server to create database..."
    postgres -D "$PG_DATA" -k /tmp -p 5432 &
    TEMP_PG_PID=$!
    
    # Wait for PostgreSQL to start
    echo "Waiting for temporary PostgreSQL to be ready..."
    until pg_isready -h localhost -k /tmp -p 5432; do
        sleep 1
    done
    
    # Use default environment variables if not set
    DB_USER="${PG_DB_USER:-postgres}"
    DB_PASS="${PG_DB_PASSWORD:-secure_password}"
    DB_NAME="${PG_DB_NAME:-resume_db}"
    
    echo "Setting up database user: $DB_USER and database: $DB_NAME"
    if [ "$DB_USER" != "postgres" ]; then
        psql -h localhost -k /tmp -p 5432 -U postgres -c "CREATE USER \"$DB_USER\" WITH PASSWORD '$DB_PASS';" || true
        psql -h localhost -k /tmp -p 5432 -U postgres -c "ALTER USER \"$DB_USER\" WITH PASSWORD '$DB_PASS';" || true
    fi
    
    psql -h localhost -k /tmp -p 5432 -U postgres -c "CREATE DATABASE \"$DB_NAME\" OWNER \"$DB_USER\";" || true
    
    echo "Stopping temporary PostgreSQL..."
    kill -TERM "$TEMP_PG_PID"
    wait "$TEMP_PG_PID" || true
    echo "PostgreSQL initialized successfully."
else
    echo "PostgreSQL data directory already initialized."
fi

# Ensure all files in /data are writeable by the running user
chmod -R 777 "$DATA_DIR"

echo "=== Running Supervisord Process Manager ==="
exec supervisord -c /etc/supervisor/supervisord.conf

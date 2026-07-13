#!/bin/bash
set -e

DATA_DIR="/data/postgres"
export PGHOST=127.0.0.1
export PGPORT=5432

read_env_value() {
    local key="$1"
    python3 - "$key" <<'PY'
from pathlib import Path
import sys
key = sys.argv[1]
path = Path('/app/.env')
if path.exists():
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        parsed_key, value = line.split('=', 1)
        parsed_key = parsed_key.strip()
        value = value.strip().strip('"').strip("'")
        if parsed_key == key:
            print(value)
            break
PY
}

DB_USER="${PG_DB_USER:-${POSTGRES_USER:-$(read_env_value PG_DB_USER)}}"
DB_PASSWORD="${PG_DB_PASSWORD:-${POSTGRES_PASSWORD:-$(read_env_value PG_DB_PASSWORD)}}"
DB_NAME="${PG_DB_NAME:-${POSTGRES_DB:-$(read_env_value PG_DB_NAME)}}"

if [ -z "$DB_USER" ]; then
    DB_USER="myuser"
fi
if [ -z "$DB_PASSWORD" ]; then
    DB_PASSWORD="mypassword"
fi
if [ -z "$DB_NAME" ]; then
    DB_NAME="mydb"
fi

if [ ! -s "$DATA_DIR/PG_VERSION" ]; then
    echo "Initializing database cluster..."
    mkdir -p "$DATA_DIR"
    chown -R postgres:postgres "$DATA_DIR"
    su - postgres -c "/usr/lib/postgresql/16/bin/initdb -D $DATA_DIR"
fi

echo "Ensuring PostgreSQL role and database..."
su - postgres -c "/usr/lib/postgresql/16/bin/pg_ctl -D $DATA_DIR -l /tmp/pg_start.log start"
until su - postgres -c "pg_isready" >/dev/null 2>&1; do sleep 1; done
su - postgres -c "psql -v ON_ERROR_STOP=1 -tAc \"SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'\" | grep -q 1 || psql -v ON_ERROR_STOP=1 -c \"CREATE ROLE $DB_USER LOGIN PASSWORD '$DB_PASSWORD';\""
if ! su - postgres -c "psql -v ON_ERROR_STOP=1 -tAc \"SELECT 1 FROM pg_database WHERE datname='$DB_NAME'\"" | grep -q 1; then
    su - postgres -c "createdb -O $DB_USER $DB_NAME"
fi
su - postgres -c "psql -v ON_ERROR_STOP=1 -c \"ALTER ROLE $DB_USER WITH SUPERUSER;\""
su - postgres -c "/usr/lib/postgresql/16/bin/pg_ctl -D $DATA_DIR stop"

chown -R postgres:postgres /data/postgres
chown -R redis:redis /data/redis

exec supervisord -c /etc/supervisor/supervisord.conf

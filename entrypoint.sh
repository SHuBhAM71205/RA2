#!/bin/bash
set -e

DATA_DIR="/data/postgres"
export PGHOST=127.0.0.1
export PGPORT=5432

if [ -f /app/.env ]; then
    DB_USER=$(python3 - <<'PY'
from pathlib import Path
path = Path('/app/.env')
for line in path.read_text().splitlines():
    line = line.strip()
    if not line or line.startswith('#') or '=' not in line:
        continue
    key, value = line.split('=', 1)
    key = key.strip()
    value = value.strip().strip('"').strip("'")
    if key == 'PG_DB_USER':
        print(value)
        break
PY
)
    DB_PASSWORD=$(python3 - <<'PY'
from pathlib import Path
path = Path('/app/.env')
for line in path.read_text().splitlines():
    line = line.strip()
    if not line or line.startswith('#') or '=' not in line:
        continue
    key, value = line.split('=', 1)
    key = key.strip()
    value = value.strip().strip('"').strip("'")
    if key == 'PG_DB_PASSWORD':
        print(value)
        break
PY
)
    DB_NAME=$(python3 - <<'PY'
from pathlib import Path
path = Path('/app/.env')
for line in path.read_text().splitlines():
    line = line.strip()
    if not line or line.startswith('#') or '=' not in line:
        continue
    key, value = line.split('=', 1)
    key = key.strip()
    value = value.strip().strip('"').strip("'")
    if key == 'PG_DB_NAME':
        print(value)
        break
PY
)
else
    DB_USER=${POSTGRES_USER:-"myuser"}
    DB_PASSWORD=${POSTGRES_PASSWORD:-"mypassword"}
    DB_NAME=${POSTGRES_DB:-"mydb"}
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

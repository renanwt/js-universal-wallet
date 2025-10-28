#!/usr/bin/env sh
set -e

DB_PATH="${DATABASE_NAME:-/app/database.sqlite}"
DB_DIR="$(dirname "$DB_PATH")"

mkdir -p "$DB_DIR"

if [ ! -s "$DB_PATH" ]; then
  echo "Database missing or empty at $DB_PATH. Running initialization script..."
  rm -f "$DB_PATH"
  node initDb.js
else
  echo "Using existing database at $DB_PATH."
fi

exec "$@"

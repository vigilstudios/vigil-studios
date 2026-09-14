#!/usr/bin/env bash
# Validate the Supabase migrations against a local PostgreSQL.
#
#   PGURL=postgres://postgres@127.0.0.1:54329/postgres scripts/db-validate.sh
#
# Creates a throwaway database, loads the auth shim, applies every migration
# in order, runs the RLS assertions, and drops the database again. Exit code
# is non-zero on the first failure. No Docker, no Supabase CLI required.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PGURL="${PGURL:-postgres://postgres@127.0.0.1:54329/postgres}"
DBNAME="vigil_validate_$$"
KEEP="${KEEP_DB:-}"

admin() { psql "$PGURL" -v ON_ERROR_STOP=1 -qAt "$@"; }
target() { psql "${PGURL%/*}/$DBNAME" -v ON_ERROR_STOP=1 -q "$@"; }

cleanup() {
  if [ -z "$KEEP" ]; then
    admin -c "drop database if exists $DBNAME" >/dev/null 2>&1 || true
  else
    echo "kept database $DBNAME"
  fi
}
trap cleanup EXIT

admin -c "create database $DBNAME" >/dev/null
echo "▸ auth shim"
target -f "$ROOT/supabase/test/auth-shim.sql"

for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "▸ $(basename "$f")"
  target -1 -f "$f"
done

echo "▸ rls assertions"
target -f "$ROOT/supabase/test/rls.test.sql"

echo "✓ migrations and RLS assertions passed"

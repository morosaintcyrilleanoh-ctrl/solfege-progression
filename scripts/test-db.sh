#!/usr/bin/env bash
# Teste les migrations et les règles d'accès sur une base PostgreSQL temporaire.
# Nécessite les binaires PostgreSQL (initdb, pg_ctl, psql). Usage : npm run test:db
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
[ -x "$PGBIN/initdb" ] || PGBIN="$(dirname "$(command -v initdb)")"
PORT="${PGPORT_TEST:-54329}"
DIR="$(mktemp -d)"
RUN=()
# PostgreSQL refuse de démarrer en root : on utilise l'utilisateur « postgres » si nécessaire.
if [ "$(id -u)" = "0" ]; then
  chown postgres "$DIR"
  RUN=(runuser -u postgres --)
fi

cleanup() {
  "${RUN[@]}" "$PGBIN/pg_ctl" -D "$DIR/data" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$DIR"
}
trap cleanup EXIT

"${RUN[@]}" "$PGBIN/initdb" -D "$DIR/data" -U postgres --auth=trust --locale=C.UTF-8 --encoding=UTF8 >/dev/null
"${RUN[@]}" "$PGBIN/pg_ctl" -D "$DIR/data" -o "-p $PORT -k $DIR -c listen_addresses=''" -l "$DIR/log" -w start >/dev/null

PSQL=("${RUN[@]}" psql -h "$DIR" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q -X)

"${PSQL[@]}" -f "$ROOT/supabase/tests/00_supabase_mock.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "→ migration $(basename "$f")"
  "${PSQL[@]}" -f "$f"
done
echo "→ tests de sécurité"
"${PSQL[@]}" -t -f "$ROOT/supabase/tests/security.test.sql"

#!/usr/bin/env bash
set -euo pipefail

REMOTE_HOST="${REMOTE_HOST:-evanh@100.98.43.68}"
REMOTE_DIR="${REMOTE_DIR:-/srv/storage/wowzerbowser/files/musicplayer}"
REMOTE_ENV="${REMOTE_ENV:-/srv/storage/wowzerbowser/deployment.env}"

git archive --format=tar HEAD | ssh -o BatchMode=yes -o ConnectTimeout=10 "$REMOTE_HOST" "mkdir -p '$REMOTE_DIR' && tar -xf - -C '$REMOTE_DIR'"

ssh -o BatchMode=yes -o ConnectTimeout=10 "$REMOTE_HOST" "REMOTE_DIR='$REMOTE_DIR' REMOTE_ENV='$REMOTE_ENV' bash -s" <<'REMOTE_SCRIPT'
set -euo pipefail
cd "$REMOTE_DIR"
mkdir -p /srv/storage/media/music
if [ ! -f .env ]; then
  umask 077
  MUSICPLAYER_POSTGRES_PASSWORD="$(openssl rand -hex 24)"
  {
    printf 'MUSICPLAYER_POSTGRES_DB=musicplayer\n'
    printf 'MUSICPLAYER_POSTGRES_USER=musicplayer\n'
    printf 'MUSICPLAYER_POSTGRES_PASSWORD=%s\n' "$MUSICPLAYER_POSTGRES_PASSWORD"
    printf 'MUSICPLAYER_WEB_PORT=3090\nMUSICPLAYER_BASE_PATH=/music\n'
    printf 'MUSICPLAYER_MUSIC_ROOT=/srv/storage/media/music\n'
    printf 'MUSIC_CATALOG_PROVIDER=deezer\nACQUISITION_ENABLED=true\nAUTHORIZED_ACQUISITION=true\n'
    printf 'SPOTDL_COMMAND=spotdl\nSPOTDL_MAX_CONCURRENT=1\nRETENTION_DAYS=30\nPREFETCH_SIZE=5\n'
  } > .env
fi
docker compose --project-name musicplayer --env-file .env build
docker compose --project-name musicplayer --env-file .env up -d postgres navidrome
docker compose --project-name musicplayer --env-file .env run --rm migrate
docker compose --project-name musicplayer --env-file .env run --rm migrate node scripts/seed.mjs
docker compose --project-name musicplayer --env-file .env run --rm migrate node scripts/check-migrations.mjs
docker compose --project-name musicplayer --env-file .env up -d web worker
tailscale serve --yes --bg --set-path=/music http://127.0.0.1:3090/music
curl --fail --silent --show-error https://homelab.tail861ffd.ts.net/music/api/health
REMOTE_SCRIPT

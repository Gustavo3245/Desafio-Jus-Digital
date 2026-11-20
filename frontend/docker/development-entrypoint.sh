#!/bin/sh

set -eu

lockfile='/app/package-lock.json'
marker='/app/node_modules/.jusdigital-package-lock.sha256'

if [ ! -f "$lockfile" ]; then
  echo 'Frontend dependency sync failed: /app/package-lock.json was not found.' >&2
  exit 1
fi

lock_hash="$(sha256sum "$lockfile")"
lock_hash="${lock_hash%% *}"
installed_hash=''

if [ -f "$marker" ]; then
  installed_hash="$(cat "$marker")"
fi

if [ "$lock_hash" != "$installed_hash" ]; then
  echo 'Frontend lockfile changed; synchronizing container dependencies...'
  npm ci --prefix /app
  printf '%s\n' "$lock_hash" > "$marker"
fi

exec "$@"

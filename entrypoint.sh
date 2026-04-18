#!/bin/sh
# Unraid-compatible entrypoint: honour PUID/PGID, fix data ownership, drop privileges.
set -e

PUID=${PUID:-1000}
PGID=${PGID:-1000}

# Create group/user matching the requested PUID/PGID if they don't already exist.
if ! getent group "$PGID" > /dev/null 2>&1; then
  addgroup -g "$PGID" appgroup
fi
if ! getent passwd "$PUID" > /dev/null 2>&1; then
  adduser -D -u "$PUID" -G "$(getent group "$PGID" | cut -d: -f1)" appuser
fi

APP_USER="$(getent passwd "$PUID" | cut -d: -f1)"

# Ensure the data directory is owned by the target user.
chown -R "$PUID:$PGID" /app/data

# Run migrations then start the server as the target user.
exec su-exec "$APP_USER" sh -c "node build/migrate.mjs && node build/index.js"

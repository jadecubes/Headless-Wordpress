#!/bin/sh
set -euo pipefail

TEMPLATE_ROOT="/templates"
RENDER_ROOT="/etc/nginx/conf.d"

REQUIRED_VARS="
  ADMIN_HOST
  API_HOST
  ADMIN_ORIGIN
  FRONTEND_ORIGIN
  UPSTREAM_HOST
  UPSTREAM_PORT
  SSL_CERT_PATH
  SSL_KEY_PATH
"

for v in $REQUIRED_VARS; do
  if [ -z "$(printenv "$v" 2>/dev/null || true)" ]; then
    echo "[entrypoint] ERROR: env var '$v' is not set" >&2
    exit 1
  fi
done

echo "[entrypoint] Rendering Nginx templates with envsubst…"

mkdir -p "$RENDER_ROOT" "$RENDER_ROOT/servers"

render() {
  src="$1"
  dst="$2"
  envsubst \
    '${ADMIN_HOST} ${API_HOST} ${ADMIN_ORIGIN} ${FRONTEND_ORIGIN} ${UPSTREAM_HOST} ${UPSTREAM_PORT} ${SSL_CERT_PATH} ${SSL_KEY_PATH}' \
    < "$src" > "$dst"
  echo "  - rendered $(basename "$src") → $dst"
}

render "$TEMPLATE_ROOT/nginx.conf.tpl"                     "/etc/nginx/nginx.conf"
render "$TEMPLATE_ROOT/servers/upstream.conf.tpl"          "$RENDER_ROOT/servers/upstream.conf"
render "$TEMPLATE_ROOT/servers/ssl.conf.tpl"               "$RENDER_ROOT/servers/ssl.conf"
render "$TEMPLATE_ROOT/servers/site-admin.conf.tpl"        "$RENDER_ROOT/servers/site-admin.conf"
render "$TEMPLATE_ROOT/servers/site-api.conf.tpl"          "$RENDER_ROOT/servers/site-api.conf"

# ⚠️ Ensure the filename below matches what you actually have on disk.
# If your file is *core-admin.conf.tpl*, either rename it to *cors-admin.conf.tpl*
# or change this line to render that exact file.
render "$TEMPLATE_ROOT/servers/cors-admin.conf.tpl"        "$RENDER_ROOT/servers/cors-admin.conf"
render "$TEMPLATE_ROOT/servers/cors-api.conf.tpl"          "$RENDER_ROOT/servers/cors-api.conf"

echo "[entrypoint] Testing nginx config…"
nginx -t

echo "[entrypoint] Starting nginx (foreground)…"
exec nginx -g "daemon off;"

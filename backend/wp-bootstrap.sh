#!/usr/bin/env bash
#
# WordPress bootstrap for containerized installs.
# - Wait for the WP (Apache) container to be reachable
# - Do a first-install if needed
# - Always enforce permalink structure
# - Always ensure JWT plugin is installed/activated
#
# Run inside the `wordpress:cli` image with /var/www/html mounted
# to the same volume as your wp container.

set -euo pipefail

# --- Env required (compose passes these) ---
: "${ADMIN_ORIGIN:?ADMIN_ORIGIN is required}"             # e.g. https://admin.mycompany.local:8443
: "${WP_ADMIN_USER:?WP_ADMIN_USER is required}"
: "${WP_ADMIN_PASS:?WP_ADMIN_PASS is required}"
: "${WP_ADMIN_EMAIL:?WP_ADMIN_EMAIL is required}"

# --- Wait for Apache in the wordpress container ---
echo "[bootstrap] Waiting for WordPress HTTP to be up..."
until curl -fsS http://wordpress/wp-login.php >/dev/null; do
  echo "[bootstrap] ...still waiting"
  sleep 2
done
echo "[bootstrap] WordPress is reachable."

# --- First install (only if not installed) ---
if ! wp core is-installed; then
  echo "[bootstrap] Fresh install detected. Installing core..."
  wp core install \
    --url="${ADMIN_ORIGIN}" \
    --title="Headless WP" \
    --admin_user="${WP_ADMIN_USER}" \
    --admin_password="${WP_ADMIN_PASS}" \
    --admin_email="${WP_ADMIN_EMAIL}"
  echo "[bootstrap] Core install complete."
else
  echo "[bootstrap] Core already installed."
fi

# --- Idempotent tasks (safe every run) ---
echo "[bootstrap] Ensuring permalinks and JWT plugin..."

# Pretty permalinks (required for /wp-json/ pretty REST routes)
wp rewrite structure "/%postname%/" --hard
wp rewrite flush --hard

# Ensure upgrade directory exists with correct permissions
mkdir -p /var/www/html/wp-content/upgrade
chown www-data:www-data /var/www/html/wp-content/upgrade

# JWT plugin (no-op if already installed; --force keeps it idempotent)
wp plugin install jwt-authentication-for-wp-rest-api --activate --force --allow-root

# Optional: diagnostics in logs
echo "[bootstrap] JWT plugin status:"
wp plugin status jwt-authentication-for-wp-rest-api || true

echo "[bootstrap] Current permalink structure:"
wp option get permalink_structure || true

echo "[bootstrap] Done."

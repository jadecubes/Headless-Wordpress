#!/usr/bin/env bash
set -euo pipefail

API_HOST="api.mycompany.local"
ADMIN_HOST="admin.mycompany.local"

mkdir -p reverse-proxy/certs/certs reverse-proxy/certs/private

openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
  -keyout reverse-proxy/certs/private/api.key \
  -out    reverse-proxy/certs/certs/api.crt \
  -subj "/CN=${API_HOST}" \
  -addext "subjectAltName=DNS:${API_HOST},DNS:${ADMIN_HOST},DNS:localhost,IP:127.0.0.1"

echo "✅ Self-signed cert generated for:"
echo "   - ${API_HOST}"
echo "   - ${ADMIN_HOST}"
echo "   - localhost (127.0.0.1)"
echo
echo "Files:"
echo "   reverse-proxy/certs/private/api.key"
echo "   reverse-proxy/certs/certs/api.crt"

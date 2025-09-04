upstream backend {
  server ${UPSTREAM_HOST}:${UPSTREAM_PORT};
  keepalive 16;
}
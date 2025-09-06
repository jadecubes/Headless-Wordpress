worker_processes auto;

events { worker_connections 1024; }

http {
  sendfile on;
  tcp_nopush on;
  tcp_nodelay on;
  keepalive_timeout 65;
  types_hash_max_size 2048;
  server_names_hash_bucket_size 64;

  include       mime.types;
  default_type  application/octet-stream;

  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_prefer_server_ciphers on;

  proxy_buffer_size         128k;
  proxy_buffers             4 64k;
  proxy_busy_buffers_size   128k;
  fastcgi_buffer_size       128k;
  fastcgi_buffers           4 256k;
  fastcgi_busy_buffers_size 256k;

  gzip on;
  absolute_redirect off;
  port_in_redirect off;

  include /etc/nginx/conf.d/servers/upstream.conf;
  include /etc/nginx/conf.d/servers/site-admin.conf;
  include /etc/nginx/conf.d/servers/site-api.conf;
}

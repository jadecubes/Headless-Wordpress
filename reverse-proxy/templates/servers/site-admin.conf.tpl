server {
  listen 80;
  server_name ${ADMIN_HOST};
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl;
  http2 on;
  server_name ${ADMIN_HOST};

  # OK to include here (server scope):
  include /etc/nginx/conf.d/servers/ssl.conf;
  include /etc/nginx/conf.d/servers/cors-admin.conf;

  # Optional: access controls...
  # allow 203.0.113.0/24; deny all;
  # auth_basic "Restricted"; auth_basic_user_file /etc/nginx/.htpasswd;

  # Lightweight handling for preflight requests at server scope (allowed):
  if ($request_method = OPTIONS) { return 204; }

  location / {
    proxy_pass         http://backend;
    proxy_set_header   Host $host;
    proxy_set_header   X-Forwarded-Host   $host:$server_port;
    proxy_set_header   X-Forwarded-Port   $server_port;
    proxy_set_header   X-Forwarded-For    $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto  https;
    proxy_redirect     off;
  }
}

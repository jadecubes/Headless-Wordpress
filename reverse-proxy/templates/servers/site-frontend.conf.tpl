server {
  listen 80;
  server_name ${FRONT_HOST};
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl;
  http2 on;
  server_name ${FRONT_HOST};

  include /etc/nginx/conf.d/servers/ssl.conf;

  # In DEV we proxy to your local dev server
  location / {
    proxy_pass         ${FRONTEND_DEV_TARGET};

    # many dev servers expect Host: localhost:3000
    proxy_set_header   Host               localhost:3000;

    # still forward the real client info
    proxy_set_header   X-Forwarded-Host   $http_host;
    proxy_set_header   X-Forwarded-Proto  https;
    proxy_set_header   X-Forwarded-Port   ${PUBLIC_TLS_PORT};
    proxy_set_header   X-Forwarded-For    $proxy_add_x_forwarded_for;

    proxy_http_version 1.1;
    proxy_set_header   Upgrade    $http_upgrade;
    proxy_set_header   Connection "upgrade";
    proxy_redirect     off;
  }
}

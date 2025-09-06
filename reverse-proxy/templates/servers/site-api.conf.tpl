server {
  listen 80;
  server_name ${API_HOST};
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl;
  http2 on;
  server_name ${API_HOST};

  include /etc/nginx/conf.d/servers/ssl.conf;
  include /etc/nginx/conf.d/servers/cors-api.conf;

  location = /wp-json { return 301 /wp-json/; }

  location ^~ /wp-json/ {
    proxy_pass         http://backend;

    proxy_set_header   Host               $http_host;
    proxy_set_header   X-Forwarded-Host   $http_host;
    proxy_set_header   X-Forwarded-Proto  https;
    proxy_set_header   X-Forwarded-Port   ${PUBLIC_TLS_PORT};

    proxy_set_header   Authorization      $http_authorization;
    proxy_set_header   X-Forwarded-For    $proxy_add_x_forwarded_for;
    proxy_redirect     off;
  }

  # Block everything else (including ?rest_route=)
  location / { return 403; }
}

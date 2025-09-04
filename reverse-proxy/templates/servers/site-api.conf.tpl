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

  if ($request_method = OPTIONS) { return 204; }

  location ^~ /wp-json/ {
    proxy_pass         http://backend;
    proxy_set_header   Host $host;
    proxy_set_header   X-Forwarded-Host   $host:$server_port;
    proxy_set_header   X-Forwarded-Port   $server_port;
    proxy_set_header   X-Forwarded-For    $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto  https;
    proxy_redirect     off;
  }

  location / { return 403; }
}

server {
  listen 80;
  server_name ${ADMIN_HOST};
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl;
  http2 on;
  server_name ${ADMIN_HOST};

  include /etc/nginx/conf.d/servers/ssl.conf;
  include /etc/nginx/conf.d/servers/cors-admin.conf;

  # Preflight
  if ($request_method = OPTIONS) { return 204; }

  # Make the root of the admin host go to the login form
  location = / { return 302 /wp-login.php; }

  location / {
    proxy_pass         http://backend;

    # preserve exact host:port the user requested
    proxy_set_header   Host               $http_host;
    proxy_set_header   X-Forwarded-Host   $http_host;

    # tell WP we're https on the public dev port
    proxy_set_header   X-Forwarded-Proto  https;
    proxy_set_header   X-Forwarded-Port   ${PUBLIC_TLS_PORT};

    proxy_set_header   X-Forwarded-For    $proxy_add_x_forwarded_for;
    proxy_redirect     off;
  }
}

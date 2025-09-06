add_header Access-Control-Allow-Origin "${FRONTEND_ORIGIN}" always;
add_header Access-Control-Allow-Credentials "true" always;
add_header Access-Control-Allow-Headers "Authorization,Content-Type" always;
add_header Access-Control-Allow-Methods "GET,POST,PUT,PATCH,DELETE,OPTIONS" always;
if ($request_method = OPTIONS) { return 204; }

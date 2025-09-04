# Cert/key are provided via env so you can swap dev/prod easily
ssl_certificate     ${SSL_CERT_PATH};
ssl_certificate_key ${SSL_KEY_PATH};

ssl_session_cache   shared:SSL:10m;
ssl_session_timeout 10m;

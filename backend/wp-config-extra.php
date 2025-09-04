<?php
// Environment
$env = getenv('WP_ENVIRONMENT_TYPE') ?: 'development';
if (!defined('WP_ENVIRONMENT_TYPE')) define('WP_ENVIRONMENT_TYPE', $env);

// Debug (only set if not already set)
$is_dev = ($env !== 'production');
if (!defined('WP_DEBUG'))     define('WP_DEBUG', $is_dev);
if (!defined('WP_DEBUG_LOG')) define('WP_DEBUG_LOG', $is_dev);

// JWT
if (!defined('JWT_AUTH_SECRET_KEY')) define('JWT_AUTH_SECRET_KEY', getenv('JWT_SECRET_KEY') ?: 'change-this-secret');
if (!defined('JWT_AUTH_CORS_ENABLE')) define('JWT_AUTH_CORS_ENABLE', true);

// Trust reverse-proxy headers
if (!empty($_SERVER['HTTP_X_FORWARDED_PROTO'])) {
  $_SERVER['HTTPS'] = $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https' ? 'on' : '';
}
if (!empty($_SERVER['HTTP_X_FORWARDED_PORT'])) {
  $_SERVER['SERVER_PORT'] = $_SERVER['HTTP_X_FORWARDED_PORT'];
}
if (!empty($_SERVER['HTTP_X_FORWARDED_HOST'])) {
  $_SERVER['HTTP_HOST'] = $_SERVER['HTTP_X_FORWARDED_HOST'];
}

// Canonical admin origin (dev may include :8443)
$admin_origin = getenv('ADMIN_ORIGIN') ?: ('https://' . getenv('ADMIN_HOST'));
if (!defined('WP_HOME'))    define('WP_HOME',    $admin_origin);
if (!defined('WP_SITEURL')) define('WP_SITEURL', $admin_origin);

// Secure admin
if (!defined('FORCE_SSL_ADMIN')) define('FORCE_SSL_ADMIN', true);

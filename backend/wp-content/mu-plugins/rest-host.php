<?php
/**
 * Keep REST responses on the current host (avoid redirecting to admin host).
 */
add_filter('rest_url', function ($url) {
    if (!isset($_SERVER['HTTP_HOST'])) return $url;

    $scheme = (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']))
        ? $_SERVER['HTTP_X_FORWARDED_PROTO']
        : ((isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http');

    $host = $_SERVER['HTTP_HOST'];
    $base = rtrim("$scheme://$host", '/') . '/wp-json/';

    $p = wp_parse_url($url);
    if (!empty($p['path']) && preg_match('#/wp-json/(.*)$#', $p['path'], $m)) {
        return $base . $m[1];
    }
    return $base;
}, 10, 1);

/**
 * Disable canonical redirects for REST requests (another redirect source).
 */
add_action('template_redirect', function () {
    if (defined('REST_REQUEST') && REST_REQUEST) {
        // WordPress by default tries to canonicalize URLs (add/remove slashes, change host).
        // For REST requests, we don't want that behavior, because it can cause redirect loops
        // between /wp-json/ and /?rest_route=/.
        remove_action('template_redirect', 'redirect_canonical');
    }
}, 0);

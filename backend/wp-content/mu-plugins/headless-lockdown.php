<?php
/**
 * Disable public theme rendering for headless mode.
 * Allows: /wp-admin, /wp-login.php, REST, cron, XML-RPC, assets under /wp-includes/ & /wp-content/.
 */
add_action('template_redirect', function () {
    if (defined('REST_REQUEST') && REST_REQUEST) return;
    if (is_admin()) return;
    $uri = $_SERVER['REQUEST_URI'] ?? '';

    // Allow auth endpoints and common internals
    $allow = [
        '/wp-login.php',
        '/wp-admin/',
        '/wp-cron.php',
        '/xmlrpc.php',
    ];
    foreach ($allow as $p) {
        if (str_starts_with($uri, $p)) return;
    }
    if (str_starts_with($uri, '/wp-includes/') || str_starts_with($uri, '/wp-content/')) return;

    // Block the rest: 404 is cleaner for headless
    status_header(404);
    nocache_headers();
    exit;
}, 0);

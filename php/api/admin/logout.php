<?php
/** DEVIXA admin logout (port of app/api/admin/logout/route.ts). */
require_once __DIR__ . '/../_load.php';
require_once DEVIXA_LIB_DIR . '/store.php';
require_once DEVIXA_LIB_DIR . '/auth.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    devixa_json(['error' => 'method'], 405);
}
devixa_audit('admin.logout', [], null, devixa_client_ip());
setcookie(ADMIN_COOKIE, '', [...devixa_session_cookie_options(), 'expires' => time() - 3600]);
devixa_json(['ok' => true]);

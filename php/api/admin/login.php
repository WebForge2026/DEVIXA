<?php
/** DEVIXA admin login (port of app/api/admin/login/route.ts). */
require_once __DIR__ . '/../_load.php';
require_once DEVIXA_LIB_DIR . '/store.php';
require_once DEVIXA_LIB_DIR . '/auth.php';
require_once DEVIXA_LIB_DIR . '/ratelimit.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    devixa_json(['error' => 'method'], 405);
}

$config = devixa_admin_config();
if (!$config['enabled'] || !is_string($config['password'])) {
    devixa_json(['error' => 'disabled'], 503);
}
$ip = devixa_client_ip();
if (devixa_rate_limit('login:' . $ip, 600_000, 5)) {
    devixa_json(['error' => 'rate'], 429);
}

$body = devixa_json_body();
$email = isset($body['email']) && is_string($body['email']) ? strtolower(trim($body['email'])) : '';
$password = isset($body['password']) && is_string($body['password']) ? $body['password'] : '';
$valid = devixa_safe_equal($email, $config['email']) && devixa_safe_equal($password, $config['password']);

if (!$valid) {
    devixa_audit('admin.login_failed', [], $email, $ip);
    usleep(600_000); // mirrors the 600 ms failure delay
    devixa_json(['error' => 'credentials'], 401);
}

devixa_audit('admin.login', [], $email, $ip);
setcookie(ADMIN_COOKIE, devixa_create_session_token($email), devixa_session_cookie_options());
devixa_json(['ok' => true]);

<?php
/** DEVIXA telemetry beacon (port of app/api/t/route.ts). Cookieless; always answers 204. */
require_once __DIR__ . '/_load.php';
require_once DEVIXA_LIB_DIR . '/store.php';
require_once DEVIXA_LIB_DIR . '/ratelimit.php';

const BOT_PATTERN = '/bot|crawl|spider|slurp|preview|headless|lighthouse|monitor|curl|wget|python|java\//i';

$ok = function (): void {
    http_response_code(204);
    header('Cache-Control: no-store');
    exit;
};

$ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
if ($ua === '' || preg_match(BOT_PATTERN, $ua) || ($_SERVER['HTTP_DNT'] ?? '') === '1' || ($_SERVER['HTTP_SEC_GPC'] ?? '') === '1') {
    $ok();
}

$body = devixa_json_body();
$type = $body['type'] ?? '';
$path = isset($body['path']) && is_string($body['path']) ? substr($body['path'], 0, 200) : '';
$locale = isset($body['locale']) && is_string($body['locale']) && in_array($body['locale'], ['de', 'en', 'bg'], true) ? $body['locale'] : 'de';
if (!str_starts_with($path, '/') || str_starts_with($path, '/admin')) {
    $ok();
}
$eventTypes = ['pageview', 'calc_view', 'calc_interact'];
if ($type !== 'heartbeat' && !in_array($type, $eventTypes, true)) {
    $ok();
}

// Daily-rotating visitor hash (same algorithm as the Node version — hash of salt|day|ip|ua).
$day = gmdate('Y-m-d');
$salt = (string) (devixa_config()['admin_session_secret'] ?? bin2hex(random_bytes(8)));
$visitor = substr(hash('sha256', "{$salt}|{$day}|" . devixa_client_ip() . "|{$ua}"), 0, 20);

try {
    if (devixa_rate_limit("t:{$visitor}", 60_000, 90)) {
        $ok();
    }
    $now = devixa_iso(devixa_now_ms());
    devixa_heartbeat($visitor, $path, $now);
    if ($type !== 'heartbeat') {
        devixa_record_event($type, $path, $locale, $visitor, $now);
    }
} catch (Throwable $error) {
    error_log('[telemetry] ' . $error->getMessage());
}
$ok();

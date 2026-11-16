<?php
/** Protected, opt-in migration endpoint. Authenticate with a Bearer token over HTTPS. */
declare(strict_types=1);
require_once __DIR__ . '/_load.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    devixa_json(['error' => 'method'], 405, ['Allow' => 'POST']);
}
$key = devixa_config()['migration_key'] ?? null;
if (!is_string($key) || strlen($key) < 32) {
    devixa_json(['error' => 'disabled'], 503);
}
$authorization = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
if (!is_string($authorization) || !preg_match('/^Bearer ([^\s]+)$/i', $authorization, $matches) || !hash_equals($key, $matches[1])) {
    devixa_json(['error' => 'unauthorized'], 401);
}
$runner = dirname(DEVIXA_LIB_DIR) . '/database/runner.php';
if (!is_file($runner)) {
    error_log('DEVIXA migration runner missing');
    devixa_json(['error' => 'unavailable'], 503);
}
require_once $runner;
try {
    devixa_json(['ok' => true] + devixa_run_migrations(devixa_pdo()));
} catch (Throwable $error) {
    error_log('DEVIXA migration failed: ' . $error->getMessage());
    devixa_json(['error' => 'migration_failed'], 500);
}

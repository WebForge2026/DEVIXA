<?php
/** DEVIXA health probe for deploy verification and uptime monitoring. */
require_once __DIR__ . '/_load.php';

$up = false;
try {
    devixa_pdo()->query('select 1');
    $up = true;
} catch (Throwable) {
    $up = false;
}
devixa_json(['ok' => $up, 'db' => $up ? 'up' : 'down', 'store' => 'db', 'time' => devixa_iso(devixa_now_ms())], $up ? 200 : 503);

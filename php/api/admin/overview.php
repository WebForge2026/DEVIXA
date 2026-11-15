<?php
/** DEVIXA admin overview (port of app/api/admin/overview/route.ts). */
require_once __DIR__ . '/../_load.php';
require_once DEVIXA_LIB_DIR . '/auth.php';
require_once DEVIXA_LIB_DIR . '/store.php';
require_once DEVIXA_LIB_DIR . '/overview.php';

$session = devixa_require_admin();
$param = $_GET['range'] ?? '30d';
$range = in_array($param, ['today', '7d', '30d', '90d'], true) ? $param : '30d';

$since = devixa_now_ms() - 181 * DAY_MS;
$events = devixa_list_events($since);
$leads = devixa_list_leads();
$presence = devixa_list_presence(devixa_now_ms() - 120_000);
devixa_json(['overview' => devixa_build_overview($range, $events, $leads, $presence), 'store' => ['kind' => 'db', 'persistent' => true]]);

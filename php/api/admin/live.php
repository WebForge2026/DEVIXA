<?php
/** DEVIXA admin live view (port of app/api/admin/live/route.ts). */
require_once __DIR__ . '/../_load.php';
require_once DEVIXA_LIB_DIR . '/auth.php';
require_once DEVIXA_LIB_DIR . '/store.php';
require_once DEVIXA_LIB_DIR . '/overview.php';

devixa_require_admin();
$now = devixa_now_ms();
$presence = devixa_list_presence($now - 120_000);
devixa_json([...devixa_live_pages($presence, $now), 'store' => ['kind' => 'db', 'persistent' => true]]);

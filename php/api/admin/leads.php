<?php
/** DEVIXA admin leads list (port of GET app/api/admin/leads/route.ts). */
require_once __DIR__ . '/../_load.php';
require_once DEVIXA_LIB_DIR . '/auth.php';
require_once DEVIXA_LIB_DIR . '/store.php';

devixa_require_admin();
devixa_json(['leads' => devixa_list_leads(), 'store' => ['kind' => 'db', 'persistent' => true]]);

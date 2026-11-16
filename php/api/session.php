<?php
/** DEVIXA admin session probe (login page gate). */
require_once __DIR__ . '/_load.php';
require_once DEVIXA_LIB_DIR . '/auth.php';

$config = devixa_admin_config();
$session = devixa_current_admin();
devixa_json(['enabled' => $config['enabled'], 'authenticated' => $session !== null]);

<?php
/** DEVIXA admin session probe (login page gate). */
require_once __DIR__ . '/_load.php';
require_once DEVIXA_LIB_DIR . '/auth.php';

$config = devixa_admin_config();
$token = $_COOKIE[ADMIN_COOKIE] ?? null;
$session = is_string($token) ? devixa_verify_session_token($token) : null;
devixa_json(['enabled' => $config['enabled'], 'authenticated' => $session !== null]);

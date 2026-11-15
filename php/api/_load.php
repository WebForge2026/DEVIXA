<?php
/**
 * Loads the DEVIXA PHP library and points it at the config file next to it
 * (_devixa/config.php). Never put secrets in this file — they live only in
 * _devixa/config.php, which .htaccess blocks from web access (403).
 * DEVIXA_CONFIG / DEVIXA_LIB env vars still override everything (local dev).
 */
$devixaLib = getenv('DEVIXA_LIB');
if (!is_string($devixaLib) || $devixaLib === '') {
    $docroot = $_SERVER['DOCUMENT_ROOT'] ?? '';
    $devixaLib = $docroot !== ''
        ? rtrim($docroot, '/') . '/_devixa/lib'   // всичко под папката на сайта; _devixa е 403 от .htaccess
        : dirname(__DIR__) . '/lib';
}
define('DEVIXA_LIB_DIR', rtrim($devixaLib, '/'));

$devixaConfig = getenv('DEVIXA_CONFIG');
if (!is_string($devixaConfig) || $devixaConfig === '') {
    // конфигът винаги стои до библиотеката (_devixa/config.php)
    putenv('DEVIXA_CONFIG=' . dirname(DEVIXA_LIB_DIR) . '/config.php');
}
require_once DEVIXA_LIB_DIR . '/bootstrap.php';

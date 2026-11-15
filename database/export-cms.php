<?php
/**
 * Prints the published CMS state as JSON — used by the rebuild-cms workflow so a
 * Next.js build can bake the current text overrides (CMS_SNAPSHOT env var).
 * Usage: php database/export-cms.php
 */

declare(strict_types=1);

$candidates = [];
$explicit = getenv('DEVIXA_CONFIG');
if (is_string($explicit) && $explicit !== '') {
    $candidates[] = $explicit;
}
$home = getenv('HOME');
if (is_string($home) && $home !== '') {
    $candidates[] = $home . '/public_html/devixa.de/_devixa/config.php';
    $candidates[] = $home . '/.devixa.php';
}
$configFile = null;
foreach ($candidates as $candidate) {
    if (is_file($candidate)) {
        $configFile = $candidate;
        break;
    }
}
$lib = getenv('DEVIXA_LIB') ?: ($configFile ? dirname($configFile) . '/lib' : dirname(__DIR__) . '/php/lib');
require_once rtrim($lib, '/') . '/store.php';

echo json_encode(devixa_get_content(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), PHP_EOL;

<?php
/**
 * DEVIXA — database migration runner (PHP CLI, mirrors scripts/migrate.mjs).
 * Applies database/migrations/*.sql in order,
 * recording applied files in `_migrations`. Safe to re-run; DDL commits implicitly.
 *
 * Usage:  DATABASE_URL / config via ~/.devixa.php
 *         php database/migrate.php
 */

declare(strict_types=1);

function migrate_config(): array
{
    $candidates = [];
    $explicit = getenv('DEVIXA_CONFIG');
    if (is_string($explicit) && $explicit !== '') {
        $candidates[] = $explicit;
    }
    $home = getenv('HOME');
    if (is_string($home) && $home !== '') {
        // всичко живее под папката на сайта; _devixa/ е забранена за уеб от .htaccess
        $candidates[] = $home . '/public_html/devixa.de/_devixa/config.php';
        $candidates[] = $home . '/.devixa.php'; // legacy
    }
    foreach ($candidates as $file) {
        if (is_file($file)) {
            $config = require $file;
            if (is_array($config)) {
                return $config;
            }
        }
    }
    fwrite(STDERR, "No config found (set DEVIXA_CONFIG or create ~/.devixa.php).\n");
    exit(1);
}

$config = migrate_config();
$url = (string) ($config['database_url'] ?? '');
$parts = parse_url($url);
if ($parts === false || ($parts['scheme'] ?? '') !== 'mysql') {
    fwrite(STDERR, "database_url must be a mysql:// DSN in the config file.\n");
    exit(1);
}
$dsn = sprintf(
    'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
    $parts['host'] ?? 'localhost',
    $parts['port'] ?? 3306,
    ltrim($parts['path'] ?? '/', '/')
);
$pdo = new PDO($dsn, rawurldecode((string) ($parts['user'] ?? '')), rawurldecode((string) ($parts['pass'] ?? '')), [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
]);

$version = $pdo->query('select version() as v')->fetch();
if (!preg_match('/^(\d+)\.(\d+)/', (string) $version['v'], $m) || (int) $m[1] < 10 || ((int) $m[1] === 10 && (int) $m[2] < 2)) {
    fwrite(STDERR, "MariaDB/MySQL >= 10.2 required; server reports {$version['v']}.\n");
    exit(1);
}

require_once __DIR__ . '/runner.php';
try {
    $result = devixa_run_migrations($pdo);
    foreach ($result['skipped'] as $file) echo "skip   {$file} (already applied)\n";
    foreach ($result['applied'] as $file) echo "ok     {$file}\n";
} catch (Throwable $error) {
    fwrite(STDERR, "Migration failed: {$error->getMessage()}\n");
    exit(1);
}

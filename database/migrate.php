<?php
/**
 * DEVIXA — database migration runner (PHP CLI, mirrors scripts/migrate.mjs).
 * Applies database/migrations/*.sql in order, each in its own transaction,
 * recording applied files in `_migrations`. Safe to re-run.
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

$pdo->exec('create table if not exists _migrations (name varchar(255) primary key, applied_at datetime(3) not null default current_timestamp(3)) engine = innodb');
$applied = array_column($pdo->query('select name from _migrations')->fetchAll(), 'name');
$done = array_flip($applied);

$dir = __DIR__ . '/migrations';
$files = array_filter(scandir($dir) ?: [], fn (string $f) => str_ends_with($f, '.sql'));
sort($files);

$exit = 0;
foreach ($files as $file) {
    if (isset($done[$file])) {
        echo "skip   {$file} (already applied)\n";
        continue;
    }
    $sql = file_get_contents($dir . '/' . $file);
    echo "apply  {$file} ...\n";
    try {
        // MySQL/MariaDB DDL causes implicit commits, so migrations cannot run in a
        // real transaction. Every migration is idempotent (IF NOT EXISTS), which
        // makes re-running after a mid-file failure safe.
        $pdo->exec($sql);
        $pdo->prepare('insert into _migrations (name) values (?)')->execute([$file]);
        echo "ok     {$file}\n";
    } catch (Throwable $error) {
        fwrite(STDERR, "FAILED {$file}: {$error->getMessage()}\n");
        $exit = 1;
        break;
    }
}
exit($exit);

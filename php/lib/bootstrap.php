<?php
/**
 * DEVIXA — PHP backend bootstrap (shared hosting, PHP ≥ 8.1).
 *
 * Configuration lives in ~/.devixa.php (NEVER inside public_html), format:
 *   <?php return [
 *     'env' => 'production',                                  // or 'development'
 *     'database_url' => 'mysql://user:password@host:3306/db', // Hetzner MariaDB
 *     'admin_session_secret' => '…',                          // ≥ 32 chars in production
 *   ];
 *
 * Resolution order: $DEVIXA_CONFIG env var (path) → <home>/.devixa.php, where
 * <home> is derived from DOCUMENT_ROOT (konsoleH: /home/<user>/public_html/<domain>).
 */

declare(strict_types=1);

function devixa_home(): string
{
    $home = getenv('HOME');
    if (is_string($home) && $home !== '') {
        return $home;
    }
    // DOCUMENT_ROOT = …/public_html/<domain> → two levels up is the account home.
    $docroot = $_SERVER['DOCUMENT_ROOT'] ?? '';
    if ($docroot !== '') {
        return dirname(dirname($docroot));
    }
    return dirname(__DIR__, 3);
}

function devixa_config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }
    $candidates = [];
    $explicit = getenv('DEVIXA_CONFIG');
    if (is_string($explicit) && $explicit !== '') {
        $candidates[] = $explicit;
    }
    $candidates[] = devixa_home() . '/.devixa.php';

    $config = [];
    foreach ($candidates as $file) {
        if (is_file($file)) {
            $loaded = require $file;
            if (is_array($loaded)) {
                $config = $loaded;
            }
            break;
        }
    }
    return $config;
}

function devixa_pdo(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $url = devixa_config()['database_url'] ?? '';
    if (!is_string($url) || $url === '') {
        throw new RuntimeException('database_url missing in ~/.devixa.php');
    }
    $parts = parse_url($url);
    if ($parts === false || ($parts['scheme'] ?? '') !== 'mysql') {
        throw new RuntimeException('database_url must be a mysql:// DSN');
    }
    $host = $parts['host'] ?? 'localhost';
    $port = $parts['port'] ?? 3306;
    $db = ltrim($parts['path'] ?? '/', '/');
    $user = rawurldecode((string) ($parts['user'] ?? ''));
    $pass = rawurldecode((string) ($parts['pass'] ?? ''));
    $pdo = new PDO(
        "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
    return $pdo;
}

/* ------------------------------------------------------------------ helpers */

/** Current Unix time in milliseconds (JS Date.now() equivalent). */
function devixa_now_ms(): int
{
    return (int) round(microtime(true) * 1000);
}

/** ISO 8601 UTC with milliseconds (JS toISOString() equivalent). */
function devixa_iso(int $ms): string
{
    return gmdate('Y-m-d\TH:i:s.v\Z', (int) floor($ms / 1000));
}

/** 'YYYY-MM-DD HH:mm:ss.SSS' (UTC, datetime(3)) → ISO 8601. */
function devixa_db_ts_to_iso(string $s): string
{
    return str_replace(' ', 'T', $s) . 'Z';
}

/** ISO 8601 → 'YYYY-MM-DD HH:mm:ss.SSS' for statements. */
function devixa_iso_to_db_ts(string $iso): string
{
    return substr(str_replace('T', ' ', $iso), 0, 23);
}

function devixa_json(mixed $data, int $status = 200, array $headers = []): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    foreach ($headers as $key => $value) {
        header("{$key}: {$value}");
    }
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function devixa_client_ip(): string
{
    $forwarded = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
    if ($forwarded !== '') {
        return trim(explode(',', $forwarded)[0]);
    }
    return $_SERVER['HTTP_X_REAL_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

function devixa_json_body(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/** Constant-time comparison (ports lib/admin/auth.ts safeEqual). */
function devixa_safe_equal(string $a, string $b): bool
{
    return hash_equals($a, $b);
}

/** Shape of the admin Lead model in JSON (camelCase keys — the admin UI consumes these). */
function devixa_lead_json(array $row, string $kind): array
{
    if ($kind === 'quote') {
        $features = json_decode($row['features'] ?? '[]', true);
        return [
            'id' => $row['id'],
            'kind' => 'quote',
            'createdAt' => devixa_db_ts_to_iso($row['created_at']),
            'status' => devixa_normalize_status($row['status'] ?? null),
            'notes' => $row['notes'] ?? '',
            'name' => null,
            'email' => $row['contact_email'],
            'company' => null,
            'phone' => null,
            'priceLow' => $row['price_low'] !== null ? (int) $row['price_low'] : null,
            'priceHigh' => $row['price_high'] !== null ? (int) $row['price_high'] : null,
            'budgetLabel' => null,
            'projectType' => null,
            'message' => null,
            'config' => [
                'systemType' => $row['system_type'],
                'features' => is_array($features) ? $features : [],
                'timeline' => $row['timeline'],
            ],
            'locale' => $row['locale'],
        ];
    }
    return [
        'id' => $row['id'],
        'kind' => 'contact',
        'createdAt' => devixa_db_ts_to_iso($row['created_at']),
        'status' => devixa_normalize_status($row['status'] ?? null),
        'notes' => $row['notes'] ?? '',
        'name' => $row['full_name'],
        'email' => $row['email'],
        'company' => $row['company'],
        'phone' => null,
        'priceLow' => null,
        'priceHigh' => null,
        'budgetLabel' => $row['estimated_budget'],
        'projectType' => $row['project_type'],
        'message' => $row['message'],
        'config' => null,
        'locale' => $row['locale'],
    ];
}

/** Ports lib/admin/types.ts normalizeStatus (legacy CRM statuses → unified set). */
function devixa_normalize_status(?string $value): string
{
    $statuses = ['new', 'contacted', 'proposal', 'won', 'archived'];
    if ($value !== null && in_array($value, $statuses, true)) {
        return $value;
    }
    if ($value === 'qualified') {
        return 'proposal';
    }
    if ($value === 'lost' || $value === 'spam') {
        return 'archived';
    }
    return 'new';
}

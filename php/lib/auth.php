<?php
/**
 * DEVIXA — admin session (port of lib/admin/auth.ts).
 * HMAC-SHA256 signed cookie, identical token format: base64url(json).base64url(sig).
 * Tokens created by the Next.js version verify here and vice versa (same secret).
 */

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

const ADMIN_COOKIE = 'devixa_admin';
const SESSION_HOURS = 12;

function devixa_admin_config(): array
{
    $config = devixa_config();
    $isProduction = ($config['env'] ?? 'production') === 'production';
    $secret = $config['admin_session_secret'] ?? null;
    if (!$isProduction && ($secret === null || $secret === '')) {
        $secret = 'dev-only-insecure-session-secret-change-me';
    }
    $enabled = is_string($secret) && $secret !== ''
        && (!$isProduction || strlen($secret) >= 32);
    return ['secret' => $secret, 'enabled' => $enabled];
}

function devixa_b64url_encode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function devixa_b64url_decode(string $data): string
{
    return base64_decode(strtr($data, '-_', '+/'), true) ?: '';
}

function devixa_create_session_token(string $email, ?string $id = null, ?string $passwordHash = null): string
{
    $secret = devixa_admin_config()['secret'];
    if (!is_string($secret) || $secret === '') {
        throw new RuntimeException('Admin session secret missing');
    }
    $data = ['email' => $email, 'exp' => devixa_now_ms() + SESSION_HOURS * 3600_000];
    if ($id !== null && $passwordHash !== null) {
        $data['id'] = $id;
        $data['credential'] = hash_hmac('sha256', $passwordHash, $secret);
    }
    $payload = devixa_b64url_encode(json_encode($data));
    $sig = devixa_b64url_encode(hash_hmac('sha256', $payload, $secret, true));
    return $payload . '.' . $sig;
}

function devixa_verify_session_token(?string $token): ?array
{
    $config = devixa_admin_config();
    $secret = $config['secret'];
    if (!$token || !is_string($secret) || $secret === '' || !$config['enabled']) {
        return null;
    }
    $parts = explode('.', $token);
    if (count($parts) !== 2 || $parts[0] === '' || $parts[1] === '') {
        return null;
    }
    [$payload, $signature] = $parts;
    $expected = devixa_b64url_encode(hash_hmac('sha256', $payload, $secret, true));
    if (!devixa_safe_equal($signature, $expected)) {
        return null;
    }
    $json = json_decode(devixa_b64url_decode($payload), true);
    if (!is_array($json) || !isset($json['email'], $json['exp'])) {
        return null;
    }
    if (!is_numeric($json['exp']) || (float) $json['exp'] < devixa_now_ms()) {
        return null;
    }
    return ['email' => (string) $json['email'], 'id' => $json['id'] ?? null, 'credential' => $json['credential'] ?? null];
}

function devixa_session_cookie_options(): array
{
    $secure = (devixa_config()['env'] ?? 'production') === 'production';
    return [
        'expires' => time() + SESSION_HOURS * 3600,
        'path' => '/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Strict',
    ];
}

/** A signed token is valid only while its database user and credentials still exist. */
function devixa_current_admin(): ?array
{
    $token = $_COOKIE[ADMIN_COOKIE] ?? null;
    $session = is_string($token) ? devixa_verify_session_token($token) : null;
    if (!$session || !is_string($session['id']) || !is_string($session['credential'])) return null;
    $stmt = devixa_pdo()->prepare('select id, email, password_hash from admin_users where id = ?');
    $stmt->execute([$session['id']]);
    $user = $stmt->fetch();
    if (!$user || !hash_equals(hash_hmac('sha256', $user['password_hash'], devixa_admin_config()['secret']), $session['credential'])) return null;
    return ['id' => $user['id'], 'email' => $user['email']];
}

/** Returns the admin session or responds 401 and exits (ports lib/admin/session.ts). */
function devixa_require_admin(): array
{
    $session = devixa_current_admin();
    if ($session !== null) {
        return $session;
    }
    devixa_json(['error' => 'unauthorized'], 401);
}

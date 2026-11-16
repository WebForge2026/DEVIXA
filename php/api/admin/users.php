<?php
/** Manage administrator accounts. Every account has full admin access. */
require_once __DIR__ . '/../_load.php';
require_once DEVIXA_LIB_DIR . '/auth.php';
require_once DEVIXA_LIB_DIR . '/store.php';

$actor = devixa_require_admin();
$pdo = devixa_pdo();
$method = $_SERVER['REQUEST_METHOD'] ?? '';
if ($method === 'GET') {
    $users = $pdo->query('select id, email, created_at from admin_users order by created_at, email')->fetchAll();
    devixa_json(['users' => $users, 'currentId' => $actor['id']]);
}
if ($method !== 'POST') devixa_json(['error' => 'method'], 405);
$body = devixa_json_body();
$action = $body['action'] ?? '';
$id = $body['id'] ?? '';
if ($action === 'create') {
    $email = strtolower(trim(is_string($body['email'] ?? null) ? $body['email'] : ''));
    $password = $body['password'] ?? '';
    if (strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL) || !is_string($password) || strlen($password) < 12 || strlen($password) > 72) devixa_json(['error' => 'invalid'], 400);
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    $hex = bin2hex($bytes);
    $id = sprintf('%s-%s-%s-%s-%s', substr($hex, 0, 8), substr($hex, 8, 4), substr($hex, 12, 4), substr($hex, 16, 4), substr($hex, 20));
    try {
        $pdo->prepare('insert into admin_users (id, email, password_hash) values (?, ?, ?)')->execute([$id, $email, password_hash($password, PASSWORD_DEFAULT)]);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') devixa_json(['error' => 'duplicate'], 409);
        throw $e;
    }
} elseif ($action === 'password') {
    $password = $body['password'] ?? '';
    if (!is_string($id) || !is_string($password) || strlen($password) < 12 || strlen($password) > 72) devixa_json(['error' => 'invalid'], 400);
    $stmt = $pdo->prepare('update admin_users set password_hash = ? where id = ?');
    $stmt->execute([password_hash($password, PASSWORD_DEFAULT), $id]);
    if (!$stmt->rowCount()) devixa_json(['error' => 'not_found'], 404);
} elseif ($action === 'delete') {
    if (!is_string($id) || $id === $actor['id']) devixa_json(['error' => 'self'], 400);
    $pdo->beginTransaction();
    $users = $pdo->query('select id from admin_users for update')->fetchAll();
    if (count($users) <= 1) { $pdo->rollBack(); devixa_json(['error' => 'last'], 400); }
    $stmt = $pdo->prepare('delete from admin_users where id = ?');
    $stmt->execute([$id]);
    if (!$stmt->rowCount()) { $pdo->rollBack(); devixa_json(['error' => 'not_found'], 404); }
    $pdo->commit();
} else {
    devixa_json(['error' => 'invalid'], 400);
}
devixa_audit('admin.user_' . $action, ['user_id' => $id], $actor['email'], devixa_client_ip());
devixa_json(['ok' => true]);

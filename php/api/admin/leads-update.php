<?php
/** DEVIXA admin lead update (port of PATCH app/api/admin/leads/[id]/route.ts). */
require_once __DIR__ . '/../_load.php';
require_once DEVIXA_LIB_DIR . '/auth.php';
require_once DEVIXA_LIB_DIR . '/store.php';

$session = devixa_require_admin();
$method = $_SERVER['REQUEST_METHOD'] ?? '';
if ($method !== 'PATCH' && $method !== 'POST') {
    devixa_json(['error' => 'method'], 405);
}

$id = (string) ($_GET['id'] ?? '');
$body = devixa_json_body();
$kind = $body['kind'] ?? '';
$patch = [];
$statuses = ['new', 'contacted', 'proposal', 'won', 'archived'];

$validId = preg_match('/^[0-9a-f-]{36}$/i', $id) === 1;
if (!$validId || ($kind !== 'quote' && $kind !== 'contact')) {
    devixa_json(['error' => 'invalid'], 400);
}
if (array_key_exists('status', $body)) {
    if (!in_array($body['status'], $statuses, true)) {
        devixa_json(['error' => 'invalid'], 400);
    }
    $patch['status'] = $body['status'];
}
if (array_key_exists('notes', $body)) {
    if (!is_string($body['notes']) || mb_strlen($body['notes']) > 5000) {
        devixa_json(['error' => 'invalid'], 400);
    }
    $patch['notes'] = $body['notes'];
}

try {
    devixa_update_lead($kind, $id, $patch);
    devixa_audit('admin.lead_update', ['kind' => $kind, 'id' => $id, ...$patch], $session['email'], devixa_client_ip());
} catch (Throwable $error) {
    error_log('[admin] lead update failed: ' . $error->getMessage());
    devixa_json(['error' => 'server'], 500);
}
devixa_json(['ok' => true]);

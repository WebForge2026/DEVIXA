<?php
/**
 * DEVIXA contact-form endpoint (port of the submitLead Server Action).
 * Validation mirrors the Zod schema; responses drive the same SubmitState contract.
 */
require_once __DIR__ . '/_load.php';
require_once DEVIXA_LIB_DIR . '/store.php';
require_once DEVIXA_LIB_DIR . '/ratelimit.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    devixa_json(['error' => 'method'], 405);
}

// Honeypot: bots fill every field; humans never see this one.
if (trim((string) ($_POST['website'] ?? '')) !== '') {
    devixa_json(['ok' => true]);
}

$fields = [
    'full_name' => trim((string) ($_POST['full_name'] ?? '')),
    'email' => trim((string) ($_POST['email'] ?? '')),
    'company' => trim((string) ($_POST['company'] ?? '')),
    'project_type' => trim((string) ($_POST['project_type'] ?? '')),
    'estimated_budget' => trim((string) ($_POST['estimated_budget'] ?? '')),
    'message' => trim((string) ($_POST['message'] ?? '')),
];
$locale = $_POST['locale'] ?? null;
$locale = is_string($locale) && in_array($locale, ['de', 'en', 'bg'], true) ? $locale : null;
$consent = ($_POST['consent'] ?? null) === 'on';

$fieldErrors = [];
if (mb_strlen($fields['full_name']) < 2 || mb_strlen($fields['full_name']) > 120) {
    $fieldErrors['full_name'] = ['invalid'];
}
if (mb_strlen($fields['email']) > 254 || !filter_var($fields['email'], FILTER_VALIDATE_EMAIL)) {
    $fieldErrors['email'] = ['invalid'];
}
if (mb_strlen($fields['company']) > 160) {
    $fieldErrors['company'] = ['invalid'];
}
if (mb_strlen($fields['project_type']) < 1 || mb_strlen($fields['project_type']) > 80) {
    $fieldErrors['project_type'] = ['invalid'];
}
if (mb_strlen($fields['estimated_budget']) < 1 || mb_strlen($fields['estimated_budget']) > 40) {
    $fieldErrors['estimated_budget'] = ['invalid'];
}
if (mb_strlen($fields['message']) < 10 || mb_strlen($fields['message']) > 5000) {
    $fieldErrors['message'] = ['invalid'];
}
if (!$consent) {
    $fieldErrors['consent'] = ['invalid'];
}
if ($fieldErrors !== []) {
    devixa_json(['reason' => 'validation', 'fieldErrors' => $fieldErrors], 400);
}

if (devixa_rate_limit('lead:' . devixa_client_ip(), 600_000, 5)) {
    devixa_json(['reason' => 'rate'], 429);
}

try {
    devixa_create_contact_lead(
        $fields['full_name'],
        $fields['email'],
        $fields['company'] === '' ? null : $fields['company'],
        $fields['project_type'],
        $fields['estimated_budget'],
        $fields['message'],
        $locale
    );
} catch (Throwable $error) {
    error_log('[leads] save failed: ' . $error->getMessage());
    devixa_json(['reason' => 'server'], 500);
}
devixa_json(['ok' => true]);

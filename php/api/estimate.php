<?php
/**
 * DEVIXA calculator endpoint (port of the submitEstimate Server Action).
 * The price is recalculated server-side; the client preview is never trusted.
 */
require_once __DIR__ . '/_load.php';
require_once DEVIXA_LIB_DIR . '/store.php';
require_once DEVIXA_LIB_DIR . '/estimate.php';
require_once DEVIXA_LIB_DIR . '/ratelimit.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    devixa_json(['error' => 'method'], 405);
}
if (trim((string) ($_POST['website'] ?? '')) !== '') {
    devixa_json(['ok' => true]);
}

$system = (string) ($_POST['system_type'] ?? '');
$features = $_POST['features'] ?? [];
$features = is_array($features) ? array_values(array_filter(array_map('strval', $features))) : [];
$timeline = (string) ($_POST['timeline'] ?? '');
$email = trim((string) ($_POST['contact_email'] ?? ''));
$locale = $_POST['locale'] ?? null;
$locale = is_string($locale) && in_array($locale, ['de', 'en', 'bg'], true) ? $locale : null;

$fieldErrors = [];
if (!in_array($system, devixa_system_types(), true)) {
    $fieldErrors['system_type'] = ['invalid'];
}
$unknown = array_diff($features, devixa_feature_ids());
if ($unknown !== [] || count($features) > count(devixa_feature_ids())) {
    $fieldErrors['features'] = ['invalid'];
}
if (!in_array($timeline, devixa_timeline_ids(), true)) {
    $fieldErrors['timeline'] = ['invalid'];
}
if (mb_strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $fieldErrors['contact_email'] = ['invalid'];
}
if ($fieldErrors !== []) {
    devixa_json(['reason' => 'validation', 'fieldErrors' => $fieldErrors], 400);
}

if (devixa_rate_limit('lead:' . devixa_client_ip(), 600_000, 5)) {
    devixa_json(['reason' => 'rate'], 429);
}


$quote = devixa_calculate_price($system, $features, $timeline);

$low = $quote === null ? null : $quote['price'];
$high = $quote === null ? null : $quote['price'];

try {
    devixa_create_quote_lead(
        $system,
        $features,
        $timeline,
        $email,
        $low,
        $high,
        $locale
    );
} catch (Throwable $error) {
    error_log('[leads] save failed: ' . $error->getMessage());
    devixa_json(['reason' => 'server'], 500);
}

devixa_json(['ok' => true]);

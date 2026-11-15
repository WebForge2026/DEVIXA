<?php
/**
 * DEVIXA admin content (port of app/api/admin/content/route.ts).
 * GET returns the published state; PUT validates and saves it.
 * Text overrides apply at build/deploy time (see .github/workflows/rebuild-cms.yml);
 * theme + media apply at runtime via CmsRuntime.
 */
require_once __DIR__ . '/../_load.php';
require_once DEVIXA_LIB_DIR . '/auth.php';
require_once DEVIXA_LIB_DIR . '/store.php';

$session = devixa_require_admin();
$method = $_SERVER['REQUEST_METHOD'] ?? '';

if ($method === 'GET') {
    devixa_json(['content' => devixa_get_content(), 'store' => ['kind' => 'db', 'persistent' => true]]);
}
if ($method !== 'PUT' && $method !== 'POST') {
    devixa_json(['error' => 'method'], 405);
}

const MAX_IMAGE_CHARS = 1_600_000;
const MAX_SLOT_IMAGES = 4;
const SLOTS = ['project-0', 'project-1', 'project-2'];
const LOCALES = ['de', 'en', 'bg'];

$body = devixa_json_body();
$fail = fn (string $msg) => devixa_json(['error' => $msg], 400);

// texts: { de?: { path: string }, … } — path shape is enforced at build time by the Next.js dictionary layer.
$texts = $body['texts'] ?? null;
if (!is_array($texts)) {
    $fail('invalid');
}
foreach (LOCALES as $locale) {
    if (!array_key_exists($locale, $texts)) {
        continue;
    }
    if (!is_array($texts[$locale])) {
        $fail('invalid');
    }
    foreach ($texts[$locale] as $value) {
        if (!is_string($value) || mb_strlen($value) > 2000) {
            $fail('invalid');
        }
    }
}

// media
$media = $body['media'] ?? null;
if (!is_array($media) || count($media) > count(SLOTS) * MAX_SLOT_IMAGES) {
    $fail('invalid');
}
$perSlot = [];
foreach ($media as $item) {
    if (!is_array($item) || !isset($item['id'], $item['slot'], $item['src'], $item['alt'], $item['updatedAt'])) {
        $fail('invalid');
    }
    if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', (string) $item['id']) !== 1) {
        $fail('invalid');
    }
    if (!in_array($item['slot'], SLOTS, true)) {
        $fail('invalid');
    }
    $src = (string) $item['src'];
    if (mb_strlen($src) > MAX_IMAGE_CHARS || preg_match('#^(data:image/(webp|jpeg|png);base64,|https://)#', $src) !== 1) {
        $fail('invalid');
    }
    if (!is_string($item['alt']) || mb_strlen($item['alt']) > 200) {
        $fail('invalid');
    }
    if (!is_string($item['updatedAt']) || mb_strlen($item['updatedAt']) > 40) {
        $fail('invalid');
    }
    $perSlot[$item['slot']] = ($perSlot[$item['slot']] ?? 0) + 1;
    if ($perSlot[$item['slot']] > MAX_SLOT_IMAGES) {
        $fail('too many images');
    }
}

// theme
$theme = $body['theme'] ?? null;
if (!is_array($theme)
    || preg_match('/^#[0-9a-fA-F]{6}$/', (string) ($theme['accent'] ?? '')) !== 1
    || !is_numeric($theme['cardRadius'] ?? null) || (float) $theme['cardRadius'] < 0 || (float) $theme['cardRadius'] > 24
    || !is_numeric($theme['glow'] ?? null) || (float) $theme['glow'] < 0 || (float) $theme['glow'] > 0.4
    || !is_numeric($theme['sphereRed'] ?? null) || (float) $theme['sphereRed'] < 0.05 || (float) $theme['sphereRed'] > 0.45
) {
    $fail('invalid');
}

$content = [
    'texts' => array_filter($texts, fn ($v) => is_array($v)),
    'media' => array_values($media),
    'theme' => [
        'accent' => $theme['accent'],
        'cardRadius' => (float) $theme['cardRadius'],
        'glow' => (float) $theme['glow'],
        'sphereRed' => (float) $theme['sphereRed'],
    ],
    'updatedAt' => devixa_iso(devixa_now_ms()),
];
// Keep empty locale records as objects in JSON (matches the ContentState shape).
$textsOut = [];
foreach (LOCALES as $locale) {
    $textsOut[$locale] = $content['texts'][$locale] ?? new stdClass();
}

try {
    devixa_save_content(['texts' => $textsOut, 'media' => $content['media'], 'theme' => $content['theme'], 'updatedAt' => $content['updatedAt']]);
    devixa_audit('admin.content_publish', ['texts' => count($content['texts']), 'media' => count($media)], $session['email'], devixa_client_ip());
} catch (Throwable $error) {
    error_log('[admin] content save failed: ' . $error->getMessage());
    devixa_json(['error' => 'server'], 500);
}
devixa_json(['ok' => true, 'updatedAt' => $content['updatedAt']]);

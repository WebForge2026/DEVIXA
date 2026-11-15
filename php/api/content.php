<?php
/** Public published CMS state (theme + media + text overrides) for CmsRuntime. Cached briefly. */
require_once __DIR__ . '/_load.php';
require_once DEVIXA_LIB_DIR . '/store.php';

try {
    devixa_json(['content' => devixa_get_content()], 200, ['Cache-Control' => 'public, max-age=15']);
} catch (Throwable $error) {
    error_log('[cms] ' . $error->getMessage());
    devixa_json(['content' => devixa_default_content()], 200, ['Cache-Control' => 'public, max-age=15']);
}

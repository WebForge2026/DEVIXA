<?php
/**
 * DEVIXA locale redirect (port of middleware.ts preferredLocale).
 * Saved choice (NEXT_LOCALE cookie) → Accept-Language (q-sorted) → German.
 * Serves / and any non-localised path by 302-redirecting to /<locale><path>.
 */

declare(strict_types=1);

const LOCALES = ['de', 'en', 'bg'];

$fromAcceptLanguage = function (string $header): ?string {
    $entries = [];
    foreach (explode(',', $header) as $part) {
        $pieces = array_map('trim', explode(';q=', trim($part)));
        $tag = strtolower(substr((string) $pieces[0], 0, 2));
        $entries[] = ['lang' => $tag, 'q' => isset($pieces[1]) ? (float) $pieces[1] : 1.0];
    }
    usort($entries, fn (array $a, array $b) => $b['q'] <=> $a['q']);
    foreach ($entries as $entry) {
        if (in_array($entry['lang'], LOCALES, true)) {
            return $entry['lang'];
        }
    }
    return null;
};

$saved = $_COOKIE['NEXT_LOCALE'] ?? null;
$locale = is_string($saved) && in_array($saved, LOCALES, true)
    ? $saved
    : ($fromAcceptLanguage($_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? '') ?? 'de');

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$target = '/' . $locale . ($path === '/' ? '' : $path);
$query = $_SERVER['QUERY_STRING'] ?? '';
if ($query !== '') {
    $target .= '?' . $query;
}
header('Location: ' . $target, true, 302);
header('Cache-Control: no-store');

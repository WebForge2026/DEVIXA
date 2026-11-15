<?php
/**
 * DEVIXA — pricing model (exact port of lib/estimate.ts).
 * Reference values are typical German agency prices (net, EUR); Devixa quotes
 * 30 % below (DEVIXA_FACTOR). The server-side recalculation is authoritative.
 * Also runnable standalone for parity tests:
 *   php estimate.php <system> <feature,csv|-> <timeline> [--market]
 */

declare(strict_types=1);

const DEVIXA_FACTOR = 0.7;

const GERMAN_BASE_RANGE = [
    'website' => [5000, 12000],
    'webshop' => [12000, 30000],
    'business-system' => [25000, 70000],
    'integration' => [8000, 25000],
];

const GERMAN_FEATURE_COST = [
    'multilang' => 2000,
    'cms' => 2500,
    'booking' => 7000,
    'payments' => 3500,
    'portal' => 9000,
    'dashboard' => 6000,
    'api' => 5000,
    'ai' => 8000,
    'migration' => 3500,
];

const TIMELINE_FACTOR = ['flexible' => 0.92, 'standard' => 1, 'priority' => 1.2];

function devixa_system_types(): array
{
    return ['website', 'webshop', 'business-system', 'integration'];
}

function devixa_feature_ids(): array
{
    return ['multilang', 'cms', 'booking', 'payments', 'portal', 'dashboard', 'api', 'ai', 'migration'];
}

function devixa_timeline_ids(): array
{
    return ['flexible', 'standard', 'priority'];
}

function devixa_round_to(float $value, int $step): int
{
    return (int) (round($value / $step) * $step); // half-up, matching Math.round for positive values
}

/** @param string[] $features */
function devixa_range(string $system, array $features, string $timeline, float $factor): array
{
    [$baseLow, $baseHigh] = GERMAN_BASE_RANGE[$system];
    $extras = 0.0;
    foreach ($features as $id) {
        $extras += GERMAN_FEATURE_COST[$id];
    }
    $t = TIMELINE_FACTOR[$timeline];
    return [
        'low' => devixa_round_to(($baseLow + $extras * 0.85) * $t * $factor, 500),
        'high' => devixa_round_to(($baseHigh + $extras * 1.15) * $t * $factor, 500),
    ];
}

/** Devixa's indicative range (30 % below the German market). */
function devixa_estimate_range(string $system, array $features, string $timeline): array
{
    return devixa_range($system, $features, $timeline, DEVIXA_FACTOR);
}

/** The German market reference for the same configuration. */
function devixa_market_range(string $system, array $features, string $timeline): array
{
    return devixa_range($system, $features, $timeline, 1.0);
}

// Standalone mode: php estimate.php website cms,ai standard [--market]
if (PHP_SAPI === 'cli' && basename($_SERVER['argv'][0] ?? '') === 'estimate.php') {
    [, $system, $featureCsv, $timeline] = array_pad($_SERVER['argv'], 4, '');
    $market = in_array('--market', $_SERVER['argv'], true);
    $features = $featureCsv === '-' ? [] : array_filter(explode(',', (string) $featureCsv));
    $result = $market
        ? devixa_market_range($system, $features, $timeline)
        : devixa_estimate_range($system, $features, $timeline);
    echo json_encode($result), PHP_EOL;
}

<?php
declare(strict_types=1);

/**
 * DEVIXA pricing calculator.
 * The server calculates prices independently from the browser.
 */


const DEVIXA_PRICING = [
    'website' => [
        'low' => 949,
        'high' => 3000,
        'maintenance_low' => 39,
        'maintenance_high' => 79,
    ],
    'webshop' => [
        'low' => 1499,
        'high' => 4299,
        'maintenance_low' => 49,
        'maintenance_high' => 139,
    ],
    'business-system' => null,
    'integration' => null,
];

const DEVIXA_FEATURE_PRICES = [
    'multilang' => 150,
    'cms' => 200,
    'booking' => 250,
    'payments' => 250,
    'portal' => 350,
    'dashboard' => 200,
    'api' => 250,
    'ai' => 350,
    'migration' => 150,
];

const DEVIXA_TIMELINE_EXTRAS = [
    'flexible' => 100,
    'standard' => 0,
    'priority' => 150,
];

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

/**
 * Calculate the DEVIXA price.
 * Returns null for services priced on request.
 *
 * @param string[] $features
 */
function devixa_calculate_price(
    string $system,
    array $features,
    string $timeline
): ?array {
    $pricing = DEVIXA_PRICING[$system] ?? null;

    if ($pricing === null) {
        return null;
    }

    $extras = 0;

    foreach (array_unique($features) as $feature) {
        $extras += DEVIXA_FEATURE_PRICES[$feature];
    }

    $timelineExtra = DEVIXA_TIMELINE_EXTRAS[$timeline];

    $price = min(
        $pricing['low'] + $extras + $timelineExtra,
        $pricing['high']
    );

    return [
        'price' => $price,
        'min' => $pricing['low'],
        'max' => $pricing['high'],
        'maintenanceLow' => $pricing['maintenance_low'],
        'maintenanceHigh' => $pricing['maintenance_high'],
    ];
}

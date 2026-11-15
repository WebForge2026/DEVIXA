<?php
/**
 * CLI for parity tests: reads a fixture JSON (events/leads/presence/range/now),
 * runs devixa_build_overview and prints the result. Usage:
 *   php php/lib/overview_cli.php tests/fixtures/overview.json
 */

declare(strict_types=1);

require_once __DIR__ . '/overview.php';

$fixtureFile = $_SERVER['argv'][1] ?? '';
$fixture = json_decode((string) file_get_contents($fixtureFile), true);
if (!is_array($fixture)) {
    fwrite(STDERR, "invalid fixture\n");
    exit(1);
}

$result = devixa_build_overview(
    (string) $fixture['range'],
    $fixture['events'],
    $fixture['leads'],
    $fixture['presence'],
    (int) $fixture['now']
);
echo json_encode($result, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), PHP_EOL;

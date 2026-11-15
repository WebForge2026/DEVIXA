<?php
/**
 * DEVIXA — dashboard aggregation (exact port of lib/admin/telemetry.ts buildOverview).
 * Pure computation over raw events + leads + presence; JSON shape identical to the
 * Next.js API the admin UI was built against.
 */

declare(strict_types=1);

const LIVE_WINDOW_MS = 60_000;
const DAY_MS = 86_400_000;

/** Ports pageLabel(). */
function devixa_page_label(string $path): string
{
    $p = preg_replace('#^/(de|en|bg)(?=/|$)#', '', $path) ?? $path;
    $p = $p === '' ? '/' : $p;
    if ($p === '/') {
        return 'Home';
    }
    if (str_starts_with($p, '/services/')) {
        return 'Service · ' . explode('/', $p)[2];
    }
    if (str_starts_with($p, '/insights/')) {
        return 'Insight · ' . explode('/', $p)[2];
    }
    return match ($p) {
        '/imprint' => 'Impressum',
        '/privacy' => 'Datenschutz',
        default => $p,
    };
}

function devixa_day_key(int $ms): string
{
    return gmdate('Y-m-d', (int) floor($ms / 1000));
}

/** @param array<int, string> $days */
function devixa_last_days(int $days, int $endMs): array
{
    $out = [];
    for ($i = 0; $i < $days; $i++) {
        $out[] = devixa_day_key($endMs - ($days - 1 - $i) * DAY_MS);
    }
    return $out;
}

/** Distinct (day, visitor) pairs among pageview events. */
function devixa_count_visits(array $events): int
{
    $set = [];
    foreach ($events as $e) {
        if ($e['type'] !== 'pageview') {
            continue;
        }
        $set[devixa_day_key((int) round(strtotime($e['createdAt']) * 1000)) . '|' . $e['visitor']] = true;
    }
    return count($set);
}

/** Ports livePages(): presence rows active within the live window, grouped by page label. */
function devixa_live_pages(array $presence, int $nowMs): array
{
    $byPage = [];
    $active = 0;
    foreach ($presence as $p) {
        if ($nowMs - (int) round(strtotime($p['lastSeen']) * 1000) > LIVE_WINDOW_MS) {
            continue;
        }
        $active++;
        $label = devixa_page_label($p['path']);
        $byPage[$label] = ($byPage[$label] ?? 0) + 1;
    }
    arsort($byPage);
    return ['live' => $active, 'pages' => array_map(fn (string $page, int $visitors) => ['page' => $page, 'visitors' => $visitors], array_keys($byPage), $byPage)];
}

/**
 * @param array $events  devixa_list_events() rows
 * @param array $leads   devixa_list_leads() rows
 * @param array $presence devixa_list_presence() rows
 */
function devixa_build_overview(string $range, array $events, array $leads, array $presence, ?int $nowMs = null): array
{
    $nowMs ??= devixa_now_ms();
    $rangeDays = ['today' => 1, '7d' => 7, '30d' => 30, '90d' => 90];
    $days = $rangeDays[$range] ?? 30;
    $start = $range === 'today' ? strtotime(gmdate('Y-m-d', (int) floor($nowMs / 1000))) * 1000 : $nowMs - $days * DAY_MS;
    $prevStart = $start - ($range === 'today' ? DAY_MS : $days * DAY_MS);

    $eventMs = fn (array $e) => (int) round(strtotime($e['createdAt']) * 1000);
    $leadMs = fn (array $l) => (int) round(strtotime($l['createdAt']) * 1000);

    $inRange = array_values(array_filter($events, fn (array $e) => $eventMs($e) >= $start));
    $inPrev = array_values(array_filter($events, fn (array $e) => $eventMs($e) >= $prevStart && $eventMs($e) < $start));
    $views = array_values(array_filter($inRange, fn (array $e) => $e['type'] === 'pageview'));
    $leadsInRange = array_values(array_filter($leads, fn (array $l) => $leadMs($l) >= $start));
    $quotes = array_values(array_filter($leadsInRange, fn (array $l) => $l['kind'] === 'quote'));

    $visits = devixa_count_visits($views);
    $visitsPrev = devixa_count_visits(array_values(array_filter($inPrev, fn (array $e) => $e['type'] === 'pageview')));

    // Trend
    $trend = [];
    foreach (devixa_last_days(max($days, 1), $nowMs) as $day) {
        $dayEvents = array_filter($inRange, fn (array $e) => devixa_day_key($eventMs($e)) === $day);
        $dayViews = array_filter($dayEvents, fn (array $e) => $e['type'] === 'pageview');
        $dayVisitors = [];
        foreach ($dayViews as $e) {
            $dayVisitors[$e['visitor']] = true;
        }
        $calcVisitors = [];
        foreach ($dayEvents as $e) {
            if ($e['type'] === 'calc_view') {
                $calcVisitors[$e['visitor']] = true;
            }
        }
        $dayLeads = 0;
        foreach ($leadsInRange as $l) {
            if (devixa_day_key($leadMs($l)) === $day) {
                $dayLeads++;
            }
        }
        $trend[] = ['day' => $day, 'visitors' => count($dayVisitors), 'pageviews' => count($dayViews), 'calcStarts' => count($calcVisitors), 'leads' => $dayLeads];
    }

    // Funnel
    $uniq = function (string $type) use ($inRange, $eventMs): int {
        $set = [];
        foreach ($inRange as $e) {
            if ($e['type'] === $type) {
                $set[devixa_day_key($eventMs($e)) . '|' . $e['visitor']] = true;
            }
        }
        return count($set);
    };
    $calcOpened = $uniq('calc_view');
    $calcUsed = $uniq('calc_interact');
    $funnel = [
        ['key' => 'visits', 'label' => 'Site visits', 'value' => $visits],
        ['key' => 'opened', 'label' => 'Calculator opened', 'value' => $calcOpened],
        ['key' => 'calculated', 'label' => 'Quote calculated', 'value' => $calcUsed],
        ['key' => 'submitted', 'label' => 'Lead submitted', 'value' => count($quotes)],
    ];
    $efficiency = $calcOpened > 0 ? min(100, (int) round(count($quotes) / $calcOpened * 100)) : 0;

    // Heatmap (84 days)
    $heatDays = devixa_last_days(84, $nowMs);
    $heatVisits = [];
    $heatLeads = [];
    $maxScore = 1;
    foreach ($heatDays as $day) {
        $dayViews = array_filter($events, fn (array $e) => $e['type'] === 'pageview' && devixa_day_key($eventMs($e)) === $day);
        $heatVisits[$day] = devixa_count_visits(array_values($dayViews));
        $heatLeads[$day] = 0;
        foreach ($leads as $l) {
            if (devixa_day_key($leadMs($l)) === $day) {
                $heatLeads[$day]++;
            }
        }
        $maxScore = max($maxScore, $heatVisits[$day] + $heatLeads[$day] * 5);
    }
    $heatmap = array_map(
        fn (string $day) => ['day' => $day, 'visits' => $heatVisits[$day], 'leads' => $heatLeads[$day], 'score' => ($heatVisits[$day] + $heatLeads[$day] * 5) / $maxScore],
        $heatDays
    );

    // Pages
    $pageMap = [];
    foreach ($views as $e) {
        $label = devixa_page_label($e['path']);
        $pageMap[$label]['views'] = ($pageMap[$label]['views'] ?? 0) + 1;
        $pageMap[$label]['visitors'][devixa_day_key($eventMs($e)) . '|' . $e['visitor']] = true;
    }
    $pages = [];
    foreach ($pageMap as $page => $v) {
        $pages[] = ['page' => $page, 'views' => $v['views'], 'visitors' => count($v['visitors'])];
    }
    usort($pages, fn (array $a, array $b) => $b['views'] <=> $a['views']);
    $pages = array_slice($pages, 0, 12);

    // Locales
    $localeMap = [];
    foreach ($views as $e) {
        $localeMap[$e['locale']] = ($localeMap[$e['locale']] ?? 0) + 1;
    }
    arsort($localeMap);
    $locales = array_map(fn (string $locale, int $v) => ['locale' => $locale, 'views' => $v], array_keys($localeMap), $localeMap);

    $live = devixa_live_pages($presence, $nowMs);
    $spark = [];
    foreach (devixa_last_days(14, $nowMs) as $day) {
        $dayViews = array_filter($events, fn (array $e) => $e['type'] === 'pageview' && devixa_day_key($eventMs($e)) === $day);
        $spark[] = devixa_count_visits(array_values($dayViews));
    }

    $unread = 0;
    foreach ($leads as $l) {
        if ($l['status'] === 'new') {
            $unread++;
        }
    }
    $pipeline = 0.0;
    foreach ($quotes as $l) {
        $pipeline += (($l['priceLow'] ?? 0) + ($l['priceHigh'] ?? 0)) / 2;
    }

    return [
        'range' => $range,
        'kpis' => [
            'live' => $live['live'],
            'visits' => $visits,
            'visitsPrev' => $visitsPrev,
            'visitsSpark' => $spark,
            'pageviews' => count($views),
            'leads' => count($leadsInRange),
            'quotes' => count($quotes),
            'conversion' => $visits > 0 ? count($leadsInRange) / $visits * 100 : 0,
            'pipeline' => $pipeline,
            'unread' => $unread,
        ],
        'trend' => $trend,
        'funnel' => $funnel,
        'efficiency' => $efficiency,
        'heatmap' => $heatmap,
        'pages' => $pages,
        'livePages' => $live['pages'],
        'locales' => $locales,
    ];
}

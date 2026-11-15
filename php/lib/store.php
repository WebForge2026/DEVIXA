<?php
/**
 * DEVIXA — persistence layer (port of the AdminStore contract + audit log, MariaDB/PDO).
 * Timestamps are exchanged as ISO 8601 UTC strings; the DB stores datetime(3) UTC.
 */

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

function devixa_default_content(): array
{
    return [
        'texts' => new stdClass(), // empty object — matches the TS Partial<Record<…>> shape
        'media' => [],
        'theme' => ['accent' => '#FF2A2A', 'cardRadius' => 0, 'glow' => 0.16, 'sphereRed' => 0.2],
        'updatedAt' => null,
    ];
}

function devixa_record_event(string $type, string $path, string $locale, string $visitor, string $createdAtIso): void
{
    devixa_pdo()->prepare('insert into site_events (type, path, locale, visitor, created_at) values (?,?,?,?,?)')
        ->execute([$type, $path, $locale, $visitor, devixa_iso_to_db_ts($createdAtIso)]);
}

function devixa_heartbeat(string $visitor, string $path, string $lastSeenIso): void
{
    devixa_pdo()->prepare(
        'insert into site_presence (visitor, path, last_seen) values (?,?,?)
         on duplicate key update path = values(path), last_seen = values(last_seen)'
    )->execute([$visitor, $path, devixa_iso_to_db_ts($lastSeenIso)]);
}

/** @return array<int, array{type:string,path:string,locale:string,visitor:string,createdAt:string}> */
function devixa_list_events(int $sinceMs): array
{
    $rows = devixa_pdo()->prepare('select type, path, locale, visitor, created_at from site_events where created_at >= ? order by created_at asc limit 100000');
    $rows->execute([devixa_iso_to_db_ts(devixa_iso($sinceMs))]);
    return array_map(
        fn (array $r) => ['type' => $r['type'], 'path' => $r['path'], 'locale' => $r['locale'], 'visitor' => $r['visitor'], 'createdAt' => devixa_db_ts_to_iso($r['created_at'])],
        $rows->fetchAll()
    );
}

/** @return array<int, array{visitor:string,path:string,lastSeen:string}> */
function devixa_list_presence(int $sinceMs): array
{
    $rows = devixa_pdo()->prepare('select visitor, path, last_seen from site_presence where last_seen >= ?');
    $rows->execute([devixa_iso_to_db_ts(devixa_iso($sinceMs))]);
    return array_map(
        fn (array $r) => ['visitor' => $r['visitor'], 'path' => $r['path'], 'lastSeen' => devixa_db_ts_to_iso($r['last_seen'])],
        $rows->fetchAll()
    );
}

function devixa_create_contact_lead(string $name, string $email, ?string $company, string $projectType, string $budget, string $message, ?string $locale): void
{
    devixa_pdo()->prepare('insert into leads (full_name, email, company, project_type, estimated_budget, message, locale) values (?,?,?,?,?,?,?)')
        ->execute([$name, $email, $company, $projectType, $budget, $message, $locale]);
}

function devixa_create_quote_lead(string $system, array $features, string $timeline, string $email, int $low, int $high, ?string $locale): void
{
    devixa_pdo()->prepare(
        'insert into project_estimates (system_type, features, timeline, contact_email, estimated_price, price_low, price_high, locale)
         values (?,?,?,?,?,?,?,?)'
    )->execute([$system, json_encode(array_values($features)), $timeline, $email, "EUR {$low}-{$high}", $low, $high, $locale]);
}

/** @return array<int, array> unified Lead list, newest first, camelCase keys */
function devixa_list_leads(): array
{
    $pdo = devixa_pdo();
    $quotes = $pdo->query('select * from project_estimates order by created_at desc limit 2000')->fetchAll();
    $contacts = $pdo->query('select * from leads order by created_at desc limit 2000')->fetchAll();
    $leads = [...array_map(fn (array $r) => devixa_lead_json($r, 'quote'), $quotes),
        ...array_map(fn (array $r) => devixa_lead_json($r, 'contact'), $contacts)];
    usort($leads, fn (array $a, array $b) => strcmp($b['createdAt'], $a['createdAt']));
    return $leads;
}

function devixa_update_lead(string $kind, string $id, array $patch): void
{
    $sets = [];
    $params = [];
    if (array_key_exists('status', $patch)) {
        $sets[] = 'status = ?';
        $params[] = $patch['status'];
    }
    if (array_key_exists('notes', $patch)) {
        $sets[] = 'notes = ?';
        $params[] = $patch['notes'];
    }
    if ($sets === []) {
        return;
    }
    $table = $kind === 'quote' ? 'project_estimates' : 'leads';
    $params[] = $id;
    devixa_pdo()->prepare("update {$table} set " . implode(', ', $sets) . ' where id = ?')->execute($params);
}

function devixa_get_content(): array
{
    $row = devixa_pdo()->prepare("select data from site_content where id = 'live'");
    $row->execute();
    $data = $row->fetch();
    if (!$data) {
        return devixa_default_content();
    }
    $decoded = json_decode($data['data'], true);
    if (!is_array($decoded)) {
        return devixa_default_content();
    }
    // Fill defaults without overriding stored values (same merge as the TS store).
    return array_merge(devixa_default_content(), $decoded);
}

function devixa_save_content(array $content): void
{
    devixa_pdo()->prepare(
        'insert into site_content (id, data, updated_at) values (\'live\', ?, ?)
         on duplicate key update data = values(data), updated_at = values(updated_at)'
    )->execute([json_encode($content, JSON_UNESCAPED_UNICODE), devixa_iso_to_db_ts(devixa_iso(devixa_now_ms()))]);
}

/** Best-effort audit trail; never throws into the caller's path. */
function devixa_audit(string $action, array $detail = [], ?string $actor = null, ?string $ip = null): void
{
    try {
        devixa_pdo()->prepare('insert into audit_log (action, actor, detail, ip) values (?,?,?,?)')
            ->execute([$action, $actor, json_encode($detail, JSON_UNESCAPED_UNICODE), $ip]);
    } catch (Throwable $error) {
        error_log('[audit] write failed: ' . $error->getMessage());
    }
}

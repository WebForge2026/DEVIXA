<?php
/**
 * DEVIXA — DB-backed sliding-window rate limiting (PHP has no shared in-memory
 * state between requests). One row per key, JSON array of hit timestamps.
 * Requires the `_rate_limits` table (migration 0002).
 */

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

/**
 * Records a hit and reports whether the key is over the limit.
 * Semantics mirror the TS per-instance limiters: hits within the window are
 * kept, the new hit is appended, and the check is `count > max`.
 */
function devixa_rate_limit(string $key, int $windowMs, int $max): bool
{
    $now = devixa_now_ms();
    $pdo = devixa_pdo();
    $stmt = $pdo->prepare('select hits from _rate_limits where rkey = ?');
    $stmt->execute([$key]);
    $row = $stmt->fetch();
    $hits = $row ? json_decode((string) $row['hits'], true) : [];
    if (!is_array($hits)) {
        $hits = [];
    }
    $hits = array_values(array_filter($hits, fn ($t) => is_numeric($t) && $now - (int) $t < $windowMs));
    $hits[] = $now;
    $pdo->prepare('insert into _rate_limits (rkey, hits, updated_at) values (?,?,?)
        on duplicate key update hits = values(hits), updated_at = values(updated_at)')
        ->execute([$key, json_encode($hits), devixa_iso_to_db_ts(devixa_iso($now))]);

    // Cheap housekeeping: ~1 % of calls drop rows idle for more than a day.
    if (mt_rand(1, 100) === 1) {
        try {
            $pdo->exec("delete from _rate_limits where updated_at < '" . devixa_iso_to_db_ts(devixa_iso($now - 86_400_000)) . "'");
        } catch (Throwable) {
            // Housekeeping is best-effort.
        }
    }
    return count($hits) > $max;
}

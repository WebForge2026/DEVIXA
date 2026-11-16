<?php
/** Apply versioned migrations in order. DDL in MariaDB commits implicitly. */
declare(strict_types=1);

function devixa_run_migrations(PDO $pdo): array
{
    $lock = $pdo->query("select get_lock('devixa_migrations', 10)")->fetchColumn();
    if ((int) $lock !== 1) throw new RuntimeException('Migration lock unavailable');
    try {
        $pdo->exec('create table if not exists _migrations (name varchar(255) primary key, applied_at datetime(3) not null default current_timestamp(3)) engine = innodb');
        $done = array_flip(array_column($pdo->query('select name from _migrations')->fetchAll(PDO::FETCH_ASSOC), 'name'));
        $entries = @scandir(__DIR__ . '/migrations');
        if ($entries === false) throw new RuntimeException('Migration directory missing');
        $files = array_filter($entries, fn (string $f) => str_ends_with($f, '.sql')); 
        sort($files);
        $applied = [];
        $skipped = [];
        foreach ($files as $file) {
            if (isset($done[$file])) { $skipped[] = $file; continue; }
            $sql = file_get_contents(__DIR__ . '/migrations/' . $file);
            if ($sql === false) throw new RuntimeException('Could not read migration');
            $pdo->exec($sql);
            $pdo->prepare('insert into _migrations (name) values (?)')->execute([$file]);
            $applied[] = $file;
        }
        return ['applied' => $applied, 'skipped' => $skipped];
    } finally {
        $pdo->query("select release_lock('devixa_migrations')");
    }
}

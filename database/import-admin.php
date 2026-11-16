<?php
/** One-time import of the existing configured administrator. Run after migrations. */
declare(strict_types=1);
$bootstrap = is_file(__DIR__ . '/../lib/bootstrap.php') ? __DIR__ . '/../lib/bootstrap.php' : __DIR__ . '/../php/lib/bootstrap.php';
require_once $bootstrap;
$config = devixa_config();
$email = strtolower(trim((string) ($config['admin_email'] ?? '')));
$password = $config['admin_password'] ?? null;
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !is_string($password) || $password === '' || strlen($password) > 72) {
    fwrite(STDERR, "Set the existing admin_email and admin_password (at most 72 bytes) in DEVIXA_CONFIG before importing.\n");
    exit(1);
}
$pdo = devixa_pdo();
// Never overwrite accounts or create a second account on a rerun.
$pdo->beginTransaction();
$pdo->query('select id from admin_users for update')->fetchAll();
if ((int) $pdo->query('select count(*) from admin_users')->fetchColumn() !== 0) {
    $pdo->rollBack();
    fwrite(STDERR, "Admin users already exist; no changes made.\n");
    exit(1);
}
$pdo->prepare('insert into admin_users (id, email, password_hash) values (uuid(), ?, ?)')->execute([$email, password_hash($password, PASSWORD_DEFAULT)]);
$pdo->commit();
echo "Existing administrator imported. Remove admin_email and admin_password from the config after verifying login.\n";

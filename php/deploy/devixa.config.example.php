<?php
/**
 * Copy this file to ~/.devixa.php (chmod 600) — the ONLY place secrets live.
 * The PHP backend refuses to run without it; see php/deploy/README.md.
 */
return [
    // 'production' enforces a ≥ 32 char session secret and secure cookies.
    // Local development may use 'development' with the built-in dev defaults.
    'env' => 'production',

    // Hetzner MariaDB (konsoleH). Format: mysql://user:password@host:3306/database
    'database_url' => 'mysql://user:password@host:3306/databasename',

    // Admin Command Center credentials (never commit real values).
    'admin_email' => 'admin@devixa.de',
    'admin_password' => '',
    'admin_session_secret' => '', // openssl rand -base64 48
];

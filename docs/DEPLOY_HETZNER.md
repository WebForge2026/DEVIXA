# Deploying DEVIXA to Hetzner Webhosting L (PHP backend + static frontend)

> **No Node.js is needed on the server.** The site runs on the standard Apache + PHP
> stack of the webhosting — PHP apps under the domain stay fully active, and **no
> konsoleH Node.js activation is required at all** (which also means no conflict with
> existing PHP applications). Node.js is used only in CI / locally to build the
> static frontend.

## Architecture

```
GitHub (push to main)
  └─ Actions: npm ci → tsc → lint → test → next build (static export)
       └─ scp release.tar.gz → SSH: deploy.sh
            ├─ ~/devixa-php/current          (PHP library, OUTSIDE web root)
            └─ ~/public_html/devixa.de/
                 ├ .htaccess                (routing, security headers, ErrorDocument)
                 ├├ api/*.php                 (PHP backend endpoints)
                 ├├ locale.php                (locale redirect, port of middleware.ts)
                 ├├ current → releases/<id>/site   (static export)
                 └├ releases/<id>/
```

## One-time server setup

1. **MariaDB** (konsoleH → Databases): database `devixa` + user. MariaDB ≥ 10.2.
2. **Secrets file**: create `public_html/devixa.de/_devixa/config.php` (`chmod 600`) from
   `php/deploy/devixa.config.example.php` with the real `database_url`,
   `admin_session_secret` (≥ 32 chars,
   `openssl rand -base64 48`). This file lives **outside `public_html`** and is
   the place for database and session secrets. Admin credentials are stored in MariaDB.
3. **Schema**: `php database/migrate.php` (creates all tables + `_migrations`,
   `_rate_limits` ledgers; safe to re-run). For a fresh database you can also paste
   `database/schema.sql` into the DB tool first.
4. **Admin account**: migration 0004 creates the initial administrator if the table is empty. Sign in after deployment and change the temporary password immediately. Existing accounts are preserved. See `database/README.md`.
5. **Web root files**: the first deploy places `.htaccess`, `locale.php` and
   `api/` into `~/public_html/devixa.de` automatically — nothing to do manually.
6. **SSH deploy key**: add your public key in konsoleH; store in GitHub Secrets:
   `HETZNER_HOST`, `HETZNER_USER`, `HETZNER_SSH_PORT` (default 22), `HETZNER_SSH_KEY`.
7. **DNS**: point devixa.de at the webhosting as usual — Apache serves everything
   (no port/proxy configuration needed).

## Deploy

Push to `main` → the workflow verifies, builds and deploys, then health-checks:
`curl -fsS https://devixa.de/api/health`.

Ръчно качване (frontend ъпдейт):
```bash
npm ci && npm run build
# качи САМО съдържанието на dist/ в public_html/devixa.de/ (WebFTP/FTP — върху съществуващите файлове)
```
Ръчно първоначално пускане (бекендът още не е на хоста):
```bash
npm ci && npm run build
mkdir -p release && cp -r dist release/site && cp -r php/api release/api \
  && cp -r php/lib release/lib && cp -r database release/database \
  && mkdir -p release/deploy && cp php/deploy/.htaccess php/deploy/locale.php release/deploy/ \
  && cp scripts/deploy.sh release/deploy.sh
tar -czf release.tar.gz -C release .
scp release.tar.gz <user>@<host>:/tmp/
ssh <user>@<host> 'mkdir -p ~/devixa-upload && cat /tmp/release.tar.gz | tar -xzf - -C ~/devixa-upload \
  && cd ~/devixa-upload && APP_ROOT=$HOME/public_html/devixa.de bash release/deploy.sh'
```

## Directory layout on the server — ВСИЧКО под папката на сайта

```
~/public_html/devixa.de/          ← само тази папка се пипа; другите сайтове не се бъркат
  .htaccess locale.php api/       ← PHP бекенд (веднъж; .htaccess забранява _devixa/ с 403)
  index.html assets/ de/ …        # съдържанието на dist/ (при ъпдейт само то се качва)
  sitemap.xml robots.txt og.png …
  _devixa/
    config.php    ← тайните (chmod 600); НЕ е уеб-достъпен (RedirectMatch 403)
    lib/          ← PHP библиотека
    database/     ← миграции + CLI инструменти
```

## Rollback

Качи предишната версия на `dist/` отново (или от локален git checkout:
`git checkout <стар-commit> && npm ci && npm run build`).
Database rollback: restore the pre-migration dump (see `docs/migration/RUNBOOK.md`).

## Troubleshooting

| Symptom | Check |
|---|---|
| 500 on `/api/*` | `~/.devixa.php` exists (chmod 600) and `database_url` is correct; PHP error log in konsoleH. |
| `/api/health` → db down | DSN credentials; `mysql -h … -u … -p… devixa -e 'select 1'`. |
| Pretty URLs 404 (e.g. `/de`) | `.htaccess` present at docroot; Apache `FollowSymLinks` (konsoleH default). |
| Site works, API 404 | `api/` directory present at docroot (deploy.sh rsyncs it). |
| Old code after deploy | `readlink -f ~/public_html/devixa.de/current`. |
| Static PHP host without symlink support | copy `current/` content directly (loses instant rollback). |

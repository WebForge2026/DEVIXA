#!/usr/bin/env bash
# =============================================================================
# DEVIXA — мързеливо прост deploy за обикновен shared hosting: ПЛОСКИ файлове,
# без symlink-ове, ВСИЧКО под папката на сайта. Работи и през FTP: разархивирай
# release.tar.gz и копирай съдържанието както е описано в docs/DEPLOY_HETZNER.md.
#
# Използване (с release.tar.gz в текущата папка или разархивирана release/ до него):
#   ./deploy.sh
#
# Структура, която създава:
#   $APP_ROOT/                 = public_html/devixa.de/
#     .htaccess locale.php api/            (бекенд; .htaccess забранява _devixa/)
#     index.html assets/ de/ …             (съдържанието на dist/)
#     _devixa/lib/…                        (PHP библиотека, НЕ е публична)
#     _devixa/database/…                   (миграции + CLI инструменти)
#   Конфигът с тайни се създава РЪЧЧНО: $APP_ROOT/_devixa/config.php (chmod 600).
# =============================================================================
set -euo pipefail

APP_ROOT="${APP_ROOT:-$HOME/public_html/devixa.de}"

if [ -f release.tar.gz ]; then
  echo "Разархивиране на release.tar.gz ..."
  rm -rf release
  mkdir release
  tar -xzf release.tar.gz -C release
fi

[ -d release/site ] || { echo "Липсва release/site — пусни скрипта до разархивирания release/."; exit 1; }

mkdir -p "$APP_ROOT"

echo "Копиране на сайта в $APP_ROOT ..."
cp -rf release/site/. "$APP_ROOT/"

echo "Копиране на API в $APP_ROOT/api ..."
mkdir -p "$APP_ROOT/api"
cp -rf release/api/. "$APP_ROOT/api/"

echo "Копиране на PHP библиотеката и базата в $APP_ROOT/_devixa/ ..."
mkdir -p "$APP_ROOT/_devixa/lib" "$APP_ROOT/_devixa/database"
cp -rf release/lib/. "$APP_ROOT/_devixa/lib/"
cp -rf release/database/. "$APP_ROOT/_devixa/database/"

# само при първо копиране — после не пипаме
[ -f "$APP_ROOT/.htaccess" ] || cp release/deploy/.htaccess "$APP_ROOT/.htaccess"
[ -f "$APP_ROOT/locale.php" ] || cp release/deploy/locale.php "$APP_ROOT/locale.php"
chmod 644 "$APP_ROOT/.htaccess" "$APP_ROOT/locale.php" "$APP_ROOT"/api/*.php "$APP_ROOT"/api/admin/*.php 2>/dev/null || true
chmod 600 "$APP_ROOT"/_devixa/config.php 2>/dev/null || true

if [ -f "$APP_ROOT/_devixa/config.php" ]; then
  echo "Миграции ..."
  (cd "$APP_ROOT/_devixa/database" && php migrate.php)
else
  echo "ВНИМАНИЕ: $APP_ROOT/_devixa/config.php липсва — създай го от release/devixa.config.example.php."
fi

cat <<EOF

ГОТОВО.
Проверка:
  curl -fsS https://devixa.de/api/health
  curl -s -o /dev/null -w "%{http_code}\n" https://devixa.de/de
  curl -s -o /dev/null -w "%{http_code}\n" https://devixa.de/_devixa/config.php   # очаква 403
Админ: https://devixa.de/admin
EOF

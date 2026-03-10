#!/usr/bin/env bash
# deploy.sh - Atualização do shopping-list-bot no VPS
# Uso: ./scripts/deploy.sh   (executar na raiz do projeto)
# Requer: git, pnpm, prisma (via pnpm), PM2. Opcional: PM2_APP_NAME para outro nome do processo.

set -e

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

if [[ ! -f "$ROOT/package.json" ]]; then
  echo "Erro: execute a partir da raiz do projeto (onde está o package.json)." >&2
  exit 1
fi

PM2_APP_NAME="${PM2_APP_NAME:-shopping-list-bot}"

echo "[deploy] git pull"
git pull

echo "[deploy] pnpm install"
pnpm install

echo "[deploy] prisma generate"
pnpm run db:generate

echo "[deploy] prisma migrate deploy"
pnpm exec prisma migrate deploy

echo "[deploy] build"
pnpm run build

echo "[deploy] pm2 restart $PM2_APP_NAME"
pm2 restart "$PM2_APP_NAME"

echo "[deploy] concluído."

#!/usr/bin/env bash
# Build used by Vercel (package.json "vercel-build").
# - Always generates the Prisma client and builds Next.js.
# - On production deployments (or MIGRATE_ON_BUILD=true) applies pending database migrations first.
# - With SEED_ON_DEPLOY=true also loads the sample content and creates the admin account
#   (for the first deployment only — remove the variable afterwards).
set -euo pipefail

npx prisma generate

# Migrations need a direct (non-pooled) connection; Neon on Vercel provides DATABASE_URL_UNPOOLED.
DIRECT_URL="${DATABASE_URL_UNPOOLED:-${POSTGRES_URL_NON_POOLING:-${DATABASE_URL:-}}}"

if [ "${VERCEL_ENV:-}" = "production" ] || [ "${MIGRATE_ON_BUILD:-}" = "true" ]; then
  if [ -z "$DIRECT_URL" ]; then
    echo "DATABASE_URL is not set. Connect a Postgres database (e.g. Neon) to this Vercel project." >&2
    exit 1
  fi
  echo "Applying database migrations…"
  DATABASE_URL="$DIRECT_URL" npx prisma migrate deploy
  if [ "${SEED_ON_DEPLOY:-}" = "true" ]; then
    echo "Seeding sample content (SEED_ON_DEPLOY=true)…"
    DATABASE_URL="$DIRECT_URL" npx tsx prisma/seed.ts
  fi
else
  echo "Skipping migrations (VERCEL_ENV=${VERCEL_ENV:-unset}; set MIGRATE_ON_BUILD=true to force)."
fi

npx next build

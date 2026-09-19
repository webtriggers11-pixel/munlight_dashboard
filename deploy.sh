#!/bin/bash
set -e

BRANCH="prod"

echo "==> Pulling latest code from $BRANCH..."
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo "==> Removing any old container (created outside compose, or by another project dir)..."
docker rm -f munlight-dashboard 2>/dev/null || true

echo "==> Building and starting munlight-dashboard..."
# VITE_* vars are baked in at build time (see docker-compose.yml build.args),
# so --build here is required on every deploy, not optional.
docker compose up -d --build

echo "==> Deployment complete. Running containers:"
docker ps --filter "name=munlight-dashboard"

echo "==> Recent logs:"
docker logs --tail 30 munlight-dashboard

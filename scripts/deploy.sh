#!/usr/bin/env bash
set -e

APP_DIR="${APP_DIR:-/var/www/myapp}"
cd "$APP_DIR"

echo "==> Installing backend dependencies..."
(cd backend && npm ci --omit=dev)

echo "==> Building backend..."
(cd backend && npm run build)

echo "==> Installing frontend dependencies..."
(cd frontend && npm ci)

echo "==> Building React frontend..."
(cd frontend && npm run build)

echo "==> Restarting Node.js app with PM2..."
if [ -f ecosystem.config.js ]; then
  if pm2 describe telemedicine > /dev/null 2>&1; then
    pm2 restart ecosystem.config.js --env production
  else
    pm2 start ecosystem.config.js --env production
  fi
else
  if pm2 describe telemedicine > /dev/null 2>&1; then
    pm2 restart telemedicine
  else
    (cd backend && pm2 start dist/main.js --name telemedicine)
  fi
fi

pm2 save
echo "==> Deploy complete."

#!/bin/sh
set -e

mkdir -p /app/data

echo "==> Applying migrations..."
python manage.py migrate --noinput

echo "==> Starting gunicorn..."
exec gunicorn config.wsgi:application \
  --bind 0.0.0.0:8002 \
  --workers 2 \
  --timeout 60 \
  --access-logfile -

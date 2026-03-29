#!/bin/sh
set -e

echo "Aguardando PostgreSQL em $DB_HOST:$DB_PORT..."
while ! python -c "
import socket
try:
    s = socket.create_connection(('$DB_HOST', int('$DB_PORT')), timeout=2)
    s.close()
    exit(0)
except Exception:
    exit(1)
" 2>/dev/null; do
  sleep 1
done

echo "PostgreSQL pronto."
echo "Gerando migrations..."
python manage.py makemigrations core --noinput
echo "Aplicando migrations..."
python manage.py migrate --noinput
echo "Populando dados de teste..."
python manage.py seed
echo "Iniciando servidor..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:8000

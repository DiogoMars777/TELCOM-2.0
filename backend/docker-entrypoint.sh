#!/bin/bash
set -e

# Asignar puerto predeterminado si no lo inyecta Railway
PORT=${PORT:-8080}

echo "=== Desplegando Backend TELCOM 2.0 ==="

# Generar enlace simbólico de almacenamiento
php artisan storage:link --quiet || true

# Optimizar cachés para producción
php artisan config:clear || true
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

# Ejecutar migraciones automáticamente si la base de datos está disponible
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "Ejecutando migraciones de base de datos..."
    php artisan migrate --force || echo "Aviso: Migraciones omitidas o pendientes de configuración."
fi

# Poblar datos automáticamente si la bandera está activa
if [ "$RUN_SEEDER" = "true" ]; then
    echo "Poblando base de datos oficial (Senior DatabaseSeeder)..."
    php artisan db:seed --force || echo "Aviso: Seeder omitido o ya ejecutado."
fi

echo "=== Servidor listo en puerto $PORT ==="
exec php -S 0.0.0.0:$PORT -t public public/index.php

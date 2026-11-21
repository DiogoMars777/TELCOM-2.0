#!/bin/bash
set -e

# Puerto predeterminado: 8000 (o variable PORT si es inyectada por Railway / Cloud)
PORT=${PORT:-8000}

echo "=== Iniciando Backend TELCOM 2.0 ==="

# Asegurar directorios de almacenamiento y permisos
mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache storage/logs bootstrap/cache
chmod -R 775 storage bootstrap/cache 2>/dev/null || true

# Asegurar archivo .env base si no existe
if [ ! -f .env ] && [ -f .env.example ]; then
    cp .env.example .env
fi

# Generar APP_KEY si no está configurada
if [ -z "$APP_KEY" ]; then
    echo "Configurando APP_KEY..."
    php artisan key:generate --force || true
fi

# Generar enlace simbólico de almacenamiento
php artisan storage:link --quiet || true

# Esperar a que la base de datos PostgreSQL esté lista
if [ -n "$DB_HOST" ]; then
    echo "Verificando conexión con base de datos en $DB_HOST:${DB_PORT:-5432}..."
    max_retries=30
    count=0
    until php -r "try { new PDO('pgsql:host='.getenv('DB_HOST').';port='.(getenv('DB_PORT')?:'5432').';dbname='.getenv('DB_DATABASE'), getenv('DB_USERNAME'), getenv('DB_PASSWORD')); exit(0); } catch (Throwable \$e) { exit(1); }" 2>/dev/null; do
        count=$((count+1))
        if [ $count -ge $max_retries ]; then
            echo "Aviso: No se pudo conectar a PostgreSQL tras $max_retries intentos. Continuando de todos modos..."
            break
        fi
        sleep 1
    done
    if [ $count -lt $max_retries ]; then
        echo "Base de datos conectada correctamente."
    fi
fi

# Ejecutar migraciones si está habilitado
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "Ejecutando migraciones de base de datos..."
    php artisan migrate --force || echo "Aviso: Error durante las migraciones."
fi

# Ejecutar seeders si está habilitado
if [ "$RUN_SEEDERS" = "true" ]; then
    echo "Poblando base de datos con dataset canónico (Seeders)..."
    php artisan db:seed --force || echo "Aviso: Seeders omitidos o ya aplicados."
fi

# Limpieza y optimización de cachés
php artisan config:clear || true
php artisan route:clear || true
php artisan view:clear || true

if [ "$APP_ENV" = "production" ]; then
    echo "Modo producción detectado: optimizando cachés..."
    php artisan config:cache || true
    php artisan route:cache || true
    php artisan view:cache || true
fi

echo "=== Servidor Backend TELCOM listo en http://0.0.0.0:$PORT ==="
exec php -S 0.0.0.0:$PORT -t public public/index.php

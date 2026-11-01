FROM php:8.3-cli-alpine

# Instalar dependencias del sistema y librerías para PostgreSQL, zip y git
RUN apk add --no-cache \
    postgresql-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    bash \
    curl \
    && docker-php-ext-install pdo pdo_pgsql pdo_mysql bcmath opcache zip

# Instalar Composer desde la imagen oficial
COPY --from=composer:2.8 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copiar manifiesto de Composer para aprovechar la caché de Docker
COPY composer.json composer.lock ./

# Instalar dependencias de producción
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

# Copiar todo el código del backend
COPY . .

# Generar autoloader optimizado
RUN composer dump-autoload --optimize --no-dev

# Permisos para storage y bootstrap/cache
RUN chown -R www-data:www-data /app/storage /app/bootstrap/cache \
    && chmod -R 775 /app/storage /app/bootstrap/cache

# Configurar script de inicio
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh && chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8000 8080

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

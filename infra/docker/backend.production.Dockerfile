# Composer binary pulled from its official image (no apt needed)
FROM composer:2.7 AS composer

# Official PHP 8.4 FPM base (Debian bookworm) — eliminates dependency on
# ondrej/php PPA + archive.ubuntu.com for the PHP toolchain, which kept
# hanging on the build runner and causing repeated 10-min timeouts.
FROM php:8.4-fpm-bookworm

ARG WWWGROUP=1000
WORKDIR /var/www/html

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC

# Abort early on pipe failures so silent curl/gpg errors don't slip through.
SHELL ["/bin/bash", "-eo", "pipefail", "-c"]

# Global apt retry policy for any future apt calls in this image.
RUN echo 'Acquire::Retries "5";' > /etc/apt/apt.conf.d/80-retries

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# System packages: runtime tools + extension build headers + mysql client
# (default-mysql-client in bookworm provides mysqldump via mariadb-client,
# needed for spatie/laravel-backup nightly at 01:30).
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       git unzip zip gosu ca-certificates curl \
       libzip-dev libpng-dev libjpeg-dev libfreetype6-dev libicu-dev \
       default-mysql-client \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# PHP extensions not bundled in php:8.4-fpm base.
# gd needs freetype + jpeg configured before install.
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" pdo_mysql gd zip bcmath intl pcntl

# Redis via pecl (pecl.php.net is a separate network from ubuntu mirrors).
RUN pecl install redis \
    && docker-php-ext-enable redis

# Composer
COPY --from=composer /usr/bin/composer /usr/bin/composer

# App user
RUN groupadd --force -g $WWWGROUP appuser \
    && useradd -ms /bin/bash --no-user-group -g $WWWGROUP -u 1337 appuser

# Copy app
COPY backend/ /var/www/html/

# PHP deps (prod, optimized autoloader)
RUN COMPOSER_ALLOW_SUPERUSER=1 composer install \
    --no-interaction --prefer-dist --no-dev --optimize-autoloader

# Laravel clear caches (config/routes will be re-cached at deploy time)
RUN php artisan config:clear \
    && php artisan route:clear \
    && php artisan view:clear

# Production PHP settings (php:8.4-fpm stores conf.d at /usr/local/etc/php/conf.d)
RUN { \
       echo 'post_max_size = 100M'; \
       echo 'upload_max_filesize = 100M'; \
       echo 'variables_order = EGPCS'; \
       echo 'opcache.enable = 1'; \
       echo 'opcache.memory_consumption = 128'; \
       echo 'opcache.max_accelerated_files = 10000'; \
       echo 'opcache.validate_timestamps = 0'; \
    } > /usr/local/etc/php/conf.d/99-production.ini

RUN chown -R appuser:appuser /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 8000

USER appuser

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]

FROM ubuntu:24.04

ARG WWWGROUP=1000

WORKDIR /var/www/html

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN apt-get update \
    && mkdir -p /etc/apt/keyrings \
    && apt-get install -y gnupg gosu curl ca-certificates zip unzip git supervisor \
    && curl -sS 'https://keyserver.ubuntu.com/pks/lookup?op=get&search=0xb8dc7e53946656efbce4c1dd71daeaab4ad4cab6' | gpg --dearmor | tee /etc/apt/keyrings/ppa_ondrej_php.gpg > /dev/null \
    && echo "deb [signed-by=/etc/apt/keyrings/ppa_ondrej_php.gpg] https://ppa.launchpadcontent.net/ondrej/php/ubuntu noble main" > /etc/apt/sources.list.d/ppa_ondrej_php.list \
    && apt-get update \
    && apt-get install -y php8.4-cli php8.4-fpm \
       php8.4-sqlite3 php8.4-gd php8.4-curl php8.4-mysql \
       php8.4-mbstring php8.4-xml php8.4-zip php8.4-bcmath \
       php8.4-intl php8.4-readline php8.4-redis \
    && curl -sLS https://getcomposer.org/installer | php -- --install-dir=/usr/bin/ --filename=composer \
    && apt-get -y autoremove && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# mysql-client-core-8.0 is isolated so transient Ubuntu mirror hangs
# don't invalidate the large PHP/composer layer above on retry.
# Only mysqldump is needed (spatie/laravel-backup runs nightly at 01:30).
RUN apt-get update \
    && apt-get install -y --no-install-recommends mysql-client-core-8.0 \
    && apt-get -y autoremove && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN groupadd --force -g $WWWGROUP appuser \
    && useradd -ms /bin/bash --no-user-group -g $WWWGROUP -u 1337 appuser

# Copy app
COPY backend/ /var/www/html/

# Install PHP deps (no dev)
RUN COMPOSER_ALLOW_SUPERUSER=1 composer install --no-interaction --prefer-dist --no-dev --optimize-autoloader

# Cache Laravel config/routes/views
RUN php artisan config:clear \
    && php artisan route:clear \
    && php artisan view:clear

# PHP production settings
RUN echo "[PHP]\npost_max_size = 100M\nupload_max_filesize = 100M\nvariables_order = EGPCS\nopcache.enable=1\nopcache.memory_consumption=128\nopcache.max_accelerated_files=10000\nopcache.validate_timestamps=0" > /etc/php/8.4/cli/conf.d/99-production.ini

RUN chown -R appuser:appuser /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 8000

USER appuser

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]

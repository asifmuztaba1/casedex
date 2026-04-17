FROM ubuntu:24.04

ARG WWWGROUP=1000

WORKDIR /var/www/html

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC

# Use bash with pipefail so `curl | gpg | tee` fails loudly if curl dies
# silently (empty keyring was letting ondrej repo "update" with no packages,
# causing PHP install to fail with exit 100).
SHELL ["/bin/bash", "-eo", "pipefail", "-c"]

# Apt resilience: retry transient network failures automatically.
RUN echo 'Acquire::Retries "5";' > /etc/apt/apt.conf.d/80-retries

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Each apt step is split into its own layer so a flaky mirror causing
# apt to hang only forces the small failing step to retry, not the
# entire toolchain. The builder runs under a 10-minute per-step timeout.

# Base tools — supervisor intentionally excluded: each container
# (backend, horizon, scheduler) runs a single process with its own CMD,
# so supervisor would be unused. Keeping it dragged in ~50 transitive
# deps including python3.12 from archive.ubuntu.com/noble-updates,
# which was the mirror hang causing repeated build timeouts.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       gnupg gosu curl ca-certificates zip unzip git \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Add ondrej/php PPA. curl -fsSL fails on HTTP error (was silently
# producing an empty keyring before, making the repo unauthenticated
# and its packages invisible to apt install).
RUN mkdir -p /etc/apt/keyrings \
    && curl -fsSL --retry 5 --retry-all-errors \
       'https://keyserver.ubuntu.com/pks/lookup?op=get&search=0xb8dc7e53946656efbce4c1dd71daeaab4ad4cab6' \
       | gpg --dearmor -o /etc/apt/keyrings/ppa_ondrej_php.gpg \
    && test -s /etc/apt/keyrings/ppa_ondrej_php.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/ppa_ondrej_php.gpg] https://ppa.launchpadcontent.net/ondrej/php/ubuntu noble main" \
       > /etc/apt/sources.list.d/ppa_ondrej_php.list

# PHP 8.4 runtime + extensions. Self-contained: its own apt-get update
# so this layer doesn't depend on lists from the PPA layer being cached.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       php8.4-cli php8.4-fpm \
       php8.4-sqlite3 php8.4-gd php8.4-curl php8.4-mysql \
       php8.4-mbstring php8.4-xml php8.4-zip php8.4-bcmath \
       php8.4-intl php8.4-readline php8.4-redis \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Composer (small download, separate layer so it doesn't invalidate PHP cache)
RUN curl -fsSL --retry 5 --retry-all-errors \
       https://getcomposer.org/installer \
       | php -- --install-dir=/usr/bin/ --filename=composer

# mysql-client-core-8.0 is isolated from the PHP layer so transient
# Ubuntu mirror hangs don't invalidate the large PHP install.
# Only mysqldump is needed (spatie/laravel-backup nightly at 01:30).
RUN apt-get update \
    && apt-get install -y --no-install-recommends mysql-client-core-8.0 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

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

# syntax=docker/dockerfile:1.7
#
# School Management SaaS - production image (Laravel 12 + Inertia/React)
#
# Stages:
#   php-base    PHP 8.4 + Apache + required extensions + hardened config
#   vendor      Composer production dependencies (no dev packages)
#   assets      Vite/React production build (needs PHP for Wayfinder route generation)
#   production  Final runtime image, runs as www-data (non-root)
#
# Build:   docker build --platform linux/amd64 -t school-management:local .
# Run:     docker run --rm -p 8080:10000 --env-file .env.docker school-management:local

ARG PHP_IMAGE=php:8.4.27-apache-bookworm
ARG NODE_IMAGE=node:22.21-bookworm-slim
ARG COMPOSER_IMAGE=composer:2.11

FROM ${COMPOSER_IMAGE} AS composer-bin
FROM ${NODE_IMAGE} AS node-bin

# ---------------------------------------------------------------------------
FROM ${PHP_IMAGE} AS php-base

ENV DEBIAN_FRONTEND=noninteractive

# install-php-extensions pulls build dependencies, compiles, then removes them,
# keeping only the runtime shared libraries (smaller, fewer CVEs than -dev pkgs).
COPY --from=mlocati/php-extension-installer:2 /usr/bin/install-php-extensions /usr/local/bin/

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends curl unzip; \
    install-php-extensions bcmath gd intl pcntl pdo_pgsql pgsql sockets zip; \
    apt-get clean; \
    rm -rf /var/lib/apt/lists/* /tmp/*; \
    mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"; \
    a2enmod rewrite headers expires remoteip; \
    a2disconf other-vhosts-access-log

COPY docker/php/production.ini "$PHP_INI_DIR/conf.d/zz-production.ini"
COPY docker/apache/ports.conf /etc/apache2/ports.conf
COPY docker/apache/000-default.conf /etc/apache2/sites-available/000-default.conf
COPY docker/apache/zz-app.conf /etc/apache2/conf-available/zz-app.conf
RUN a2enconf zz-app

WORKDIR /var/www/html

# ---------------------------------------------------------------------------
FROM php-base AS vendor

COPY --from=composer-bin /usr/bin/composer /usr/bin/composer

# Dependency layer: only re-run when composer.json / composer.lock change.
COPY composer.json composer.lock ./
RUN composer install \
        --no-dev \
        --no-scripts \
        --no-autoloader \
        --prefer-dist \
        --no-interaction \
        --no-progress

COPY . .
RUN composer dump-autoload --optimize --no-dev --no-scripts \
    && php artisan package:discover --ansi

# ---------------------------------------------------------------------------
FROM php-base AS assets

# Node is copied in (instead of using a Node base image) because the Wayfinder
# Vite plugin runs `php artisan wayfinder:generate` during the build.
COPY --from=node-bin /usr/local/bin/node /usr/local/bin/node
COPY --from=node-bin /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY --from=vendor /var/www/html ./

ARG VITE_APP_NAME="School Management Platform"
ENV VITE_APP_NAME=${VITE_APP_NAME}
RUN npm run build

# ---------------------------------------------------------------------------
FROM php-base AS production

ARG APP_RELEASE=""
ENV APP_ENV=production \
    APP_DEBUG=false \
    APP_RELEASE=${APP_RELEASE} \
    LOG_CHANNEL=stderr \
    PORT=10000 \
    RUN_MIGRATIONS=false \
    RISK_ML_ENABLED=false \
    APACHE_MAX_REQUEST_WORKERS=10 \
    APACHE_START_SERVERS=2

COPY --from=vendor --chown=www-data:www-data /var/www/html /var/www/html
COPY --from=assets --chown=www-data:www-data /var/www/html/public/build /var/www/html/public/build
COPY --chmod=0755 docker/entrypoint.sh /usr/local/bin/app-entrypoint

# Route/view/event caches do not depend on runtime secrets, so build them once
# here instead of on every cold start. Config is cached at boot (needs env).
RUN set -eux; \
    mkdir -p storage/app/private storage/app/public storage/framework/cache/data \
             storage/framework/sessions storage/framework/views storage/logs bootstrap/cache; \
    php artisan storage:link --no-interaction; \
    php artisan route:cache --no-interaction; \
    php artisan view:cache --no-interaction; \
    php artisan event:cache --no-interaction; \
    rm -f bootstrap/cache/config.php; \
    chown -R www-data:www-data storage bootstrap/cache public/storage; \
    chmod -R u=rwX,g=rX,o= storage bootstrap/cache

# Apache only needs root to bind ports < 1024. Render uses PORT=10000.
# Numeric UID/GID (33 = www-data) so runAsNonRoot policies can verify it.
USER 33:33

EXPOSE 10000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD ["sh", "-c", "curl -fsS \"http://127.0.0.1:${PORT}/up\" > /dev/null || exit 1"]

ENTRYPOINT ["app-entrypoint"]
CMD ["apache2-foreground"]

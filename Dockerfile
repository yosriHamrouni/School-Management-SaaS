FROM php:8.4-apache-bookworm AS php-base

ENV DEBIAN_FRONTEND=noninteractive \
    APACHE_DOCUMENT_ROOT=/var/www/html/public

WORKDIR /var/www/html

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libcurl4-openssl-dev \
        libfreetype6-dev \
        libicu-dev \
        libjpeg62-turbo-dev \
        libonig-dev \
        libpng-dev \
        libpq-dev \
        libxml2-dev \
        libzip-dev \
        unzip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
        bcmath \
        curl \
        gd \
        intl \
        mbstring \
        pcntl \
        pdo_pgsql \
        pgsql \
        sockets \
        zip \
    && a2enmod rewrite headers expires \
    && rm -rf /var/lib/apt/lists/*

FROM php-base AS composer-dependencies

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY . .

RUN composer install \
        --no-dev \
        --prefer-dist \
        --optimize-autoloader \
        --no-interaction \
        --no-progress \
        --no-scripts \
    && php artisan package:discover --ansi

FROM node:22-bookworm-slim AS node-runtime

FROM php-base AS frontend-build

WORKDIR /var/www/html

# Keep Artisan and Wayfinder on the same PHP 8.4 runtime as Composer and
# production, while importing Node.js/npm from the official Node 22 image.
COPY --from=node-runtime /usr/local/ /usr/local/

RUN php -v \
    && node --version \
    && npm --version

ARG VITE_APP_NAME="School Management Platform"
ENV VITE_APP_NAME=${VITE_APP_NAME}

COPY . .
COPY --from=composer-dependencies /var/www/html/vendor ./vendor

RUN npm ci --no-audit --no-fund \
    && npm run build

FROM php-base AS production

ENV APP_ENV=production \
    APP_DEBUG=false \
    LOG_CHANNEL=stderr \
    PORT=10000 \
    RUN_MIGRATIONS=true \
    RISK_ML_ENABLED=false

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY . .
COPY --from=composer-dependencies /var/www/html/vendor ./vendor
COPY --from=frontend-build /var/www/html/public/build ./public/build
COPY docker/apache-vhost.conf /etc/apache2/sites-available/000-default.conf
COPY docker/entrypoint.sh /usr/local/bin/render-entrypoint

RUN mkdir -p \
        storage/app/private \
        storage/app/public \
        storage/framework/cache/data \
        storage/framework/sessions \
        storage/framework/views \
        storage/logs \
        bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R ug+rwX storage bootstrap/cache \
    && chmod +x /usr/local/bin/render-entrypoint

EXPOSE 10000

ENTRYPOINT ["render-entrypoint"]
CMD ["apache2-foreground"]

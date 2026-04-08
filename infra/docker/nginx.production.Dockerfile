FROM nginx:1.27-alpine
COPY infra/docker/nginx.production.conf /etc/nginx/conf.d/default.conf

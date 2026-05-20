FROM postgres:16-alpine

LABEL maintainer="k8s-demo"
LABEL description="Task Manager PostgreSQL Database"

# Default env vars — overridden by K8s Secrets in production
ENV POSTGRES_DB=taskdb
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=changeme_in_production

# This folder is magic — PostgreSQL auto-runs all *.sql
# files here when the data directory is empty (first start)
COPY init.sql /docker-entrypoint-initdb.d/01-init.sql

USER postgres

EXPOSE 5432

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
    CMD pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB} || exit 1
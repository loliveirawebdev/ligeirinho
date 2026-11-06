#!/bin/sh
# Least privilege (rules/security.md): migrations run as the database owner; the application connects as a
# user that can only read and write rows in the tables the owner creates (grants in 02-application-grants.sql).
set -eu
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<SQL
CREATE ROLE app_user LOGIN PASSWORD 'app_user';
GRANT CONNECT ON DATABASE "$POSTGRES_DB" TO app_user;
SQL

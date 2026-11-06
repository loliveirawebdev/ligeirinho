#!/bin/sh
# Least privilege (rules/security.md): migrations run as the database owner; the application connects as a
# user that can only read and write rows in the tables the owner creates.
set -eu
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<SQL
CREATE ROLE app_user LOGIN PASSWORD 'app_user';
GRANT CONNECT ON DATABASE "$POSTGRES_DB" TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES FOR ROLE "$POSTGRES_USER" IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES FOR ROLE "$POSTGRES_USER" IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_user;
SQL

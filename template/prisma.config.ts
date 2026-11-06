import { defineConfig, env } from 'prisma/config';

// Migrations run with the migration user, which owns the schema. The application connects with a
// user that can only read and write rows (least privilege, see rules/security.md).
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: env('MIGRATION_DATABASE_URL') },
});

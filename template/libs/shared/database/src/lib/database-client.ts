import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

export type DatabaseClient = PrismaClient;

export const DATABASE_CLIENT = Symbol('DatabaseClient');

export function createDatabaseClient(databaseUrl: string): DatabaseClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
}

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }
  // keepAlive prevents the TCP connection from being silently dropped by the
  // DB server (e.g. Neon) during long-running operations like AI generation.
  // idleTimeoutMillis: 0 disables the pool's own idle-close logic so the
  // connection stays alive between the pre-generation and post-generation DB writes.
  const pool = new Pool({
    connectionString,
    keepAlive: true,
    idleTimeoutMillis: 0,
    connectionTimeoutMillis: 10_000,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

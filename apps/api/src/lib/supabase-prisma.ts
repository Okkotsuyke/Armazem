import { prisma } from '@/lib/prisma';

/**
 * Atualizar conexão Prisma para Supabase
 * Substituir connection_limit no pool para Supabase
 */

const connectionLimit = process.env.NODE_ENV === 'production'
  ? 10
  : 5;

export const prismaClientOptions = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL
        ? `${process.env.DATABASE_URL}&connection_limit=${connectionLimit}&pool_timeout=10`
        : undefined,
    },
  },
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
};

export async function createPrismaClient() {
  return prisma.$extends({
    query: {
      async $allOperations({ operation, model, args, query }) {
        // Log em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Prisma] ${operation} on ${model}`);
        }
        return query(args);
      },
    },
  });
}

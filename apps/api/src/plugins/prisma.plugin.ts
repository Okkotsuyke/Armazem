/**
 * Prisma plugin — adiciona prisma client ao fastify instance
 */
import fp from 'fastify-plugin';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

async function prismaPluginInner(fastify: FastifyInstance) {
  // Em testes, pular conexão real — os mocks do vitest fornecem stubs
  if (process.env.NODE_ENV === 'test') {
    fastify.log.info('Prisma plugin skipped (test mode)');
    return;
  }

  // Configurar URL do banco - usar E3_POSTGRES_URL se DATABASE_URL não estiver disponível
  const databaseUrl = process.env.DATABASE_URL || process.env.E3_POSTGRES_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL or E3_POSTGRES_URL environment variable is required');
  }

  const prisma = new PrismaClient({
    log: process.env.NODE_ENV !== 'production' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  await prisma.$connect();
  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
}

export const prismaPlugin = fp(prismaPluginInner, {
  name: 'prisma-plugin',
});

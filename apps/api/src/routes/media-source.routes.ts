/**
 * Media source routes — gerenciamento de mídias e normalização
 */
import { FastifyPluginAsync } from 'fastify';
import { MediaCategory } from '@prisma/client';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

export const mediaSourceRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', authenticate);

  // GET /api/v1/media-sources
  fastify.get('/', async (request) => {
    const { active, category } = request.query as { active?: string; category?: string };
    const sources = await fastify.prisma.mediaSource.findMany({
      where: {
        ...(active !== undefined ? { active: active === 'true' } : {}),
        ...(category ? { category: category as MediaCategory } : {}),
      },
      orderBy: { normalizedName: 'asc' },
    });
    return sources;
  });

  // PUT /api/v1/media-sources/:id (ADMIN) — atualizar normalização
  fastify.put('/:id',
    { onRequest: requireRoles(['ADMIN']) },
    async (request, reply) => {
      const body = request.body as { normalizedName?: string; category?: string };
      const params = request.params as { id: string };
      const source = await fastify.prisma.mediaSource.update({
        where: { id: params.id },
        data: {
          ...(body.normalizedName ? { normalizedName: body.normalizedName } : {}),
          ...(body.category ? { category: body.category as MediaCategory } : {}),
        },
      });
      return source;
    },
  );
};

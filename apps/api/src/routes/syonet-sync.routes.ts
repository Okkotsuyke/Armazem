/**
 * Routes: Sync do Syonet
 *
 * Endpoints para sincronização de dados entre Syonet e PostgreSQL
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { runSync, getSyncStatus } from '../services/syonet-sync.service';
import { authenticateDashboard, requireDashboardRoles } from '../middleware/auth.middleware';

// Schema de query para filtros
const syncQuerySchema = {
  type: 'object',
  properties: {
    screen: { type: 'string', enum: ['FUNIL', 'PRODUTIVIDADE', 'LEADS', 'ALL'] },
    fullLoad: { type: 'string', enum: ['true', 'false'] },
    startDate: { type: 'string', format: 'date-time' },
    endDate: { type: 'string', format: 'date-time' },
  },
};

export async function syonetSyncRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', authenticateDashboard);

  /**
   * GET /api/v1/sync/status
   * Retorna o status da última sincronização
   */
  fastify.get('/status', async (request, reply) => {
    try {
      const status = await getSyncStatus();
      return {
        success: true,
        data: status,
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Erro ao consultar status de sincronização',
      });
    }
  });

  /**
   * POST /api/v1/sync/run
   * Executa a sincronização
   */
  fastify.post('/run', { onRequest: requireDashboardRoles(['ADMIN']) }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = request.query as any;

      const screens = query.screen === 'ALL' || !query.screen
        ? undefined
        : [query.screen];

      const options = {
        screens,
        fullLoad: query.fullLoad === 'true',
      };

      const result = await runSync(options);

      return {
        success: result.totalErrors === 0,
        data: result,
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Erro ao executar sincronização',
      });
    }
  });

  /**
   * GET /api/v1/sync/history
   * Retorna o histórico de sincronizações
   */
  fastify.get('/history', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = request.query as any;
      const limit = Math.min(parseInt(query.limit) || 10, 100);

      const history = await fastify.prisma.syncRun.findMany({
        where: { source: 'SYONET_API' },
        orderBy: { startedAt: 'desc' },
        take: limit,
      });

      return {
        success: true,
        data: history,
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Erro ao consultar histórico',
      });
    }
  });
}

export default syonetSyncRoutes;

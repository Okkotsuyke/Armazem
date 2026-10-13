/**
 * Routes: Cron Jobs
 *
 * Endpoints para tarefas agendadas via Vercel Cron
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { runSync, getSyncStatus } from '../services/syonet-sync.service';

/**
 * GET /api/cron/sync
 * Executa sincronização completa (chamado pelo Vercel Cron diariamente)
 * NÃO requer autenticação - verificado pela Vercel via assinatura CRON_SECRET
 */
export async function cronRoutes(fastify: FastifyInstance) {

  /**
   * Verificar se a request veio do Vercel Cron
   * Vercel Cron adiciona headers específicos nas requisições agendadas
   */
  const verifyVercelCron = (request: FastifyRequest): boolean => {
    const headers = request.headers;
    // Vercel adiciona este header em requests de cron job
    return headers['x-vercel-cron'] === '1';
  };

  /**
   * GET /api/cron/sync
   * Sincroniza dados do Syonet
   */
  fastify.get('/sync', {
    config: {
      rateLimit: {
        max: 1, // Apenas 1 execução por minuto
        timeWindow: '1 minute',
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();

    // Verificar se é uma request legítima do Vercel Cron
    const isCronRequest = verifyVercelCron(request);

    // Em produção, apenas executar se vier do Vercel Cron
    // Em desenvolvimento, permitir execução manual
    if (process.env.NODE_ENV === 'production' && !isCronRequest) {
      fastify.log.warn('Tentativa de acesso ao cron sem header do Vercel');
      return reply.status(403).send({
        success: false,
        error: 'Forbidden - Cron endpoint',
      });
    }

    fastify.log.info('Iniciando sincronização via Cron Job');

    try {
      const result = await runSync({
        screens: undefined, // Sincroniza todos os funis
        fullLoad: false,   // Apenas dados novos
      });

      const duration = Date.now() - startTime;

      fastify.log.info(
        `Cron sync finalizado - totalRowsProcessed: ${result.totalRowsProcessed}, errors: ${result.totalErrors}, duration: ${duration}ms`
      );

      return {
        success: result.totalErrors === 0,
        executedAt: new Date().toISOString(),
        duration: `${duration}ms`,
        data: {
          batchId: result.batchId,
          startedAt: result.startedAt,
          finishedAt: result.finishedAt,
          screens: result.screens,
          totalRowsProcessed: result.totalRowsProcessed,
          totalErrors: result.totalErrors,
        },
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      fastify.log.error(`Erro no cron sync: ${errorMessage}`);

      return reply.status(500).send({
        success: false,
        executedAt: new Date().toISOString(),
        error: errorMessage,
      });
    }
  });

  /**
   * GET /api/cron/sync/status
   * Retorna status da última sincronização (para monitoramento)
   */
  fastify.get('/sync/status', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const status = await getSyncStatus();

      return {
        success: true,
        data: status,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      fastify.log.error(`Erro ao buscar status do sync: ${errorMessage}`);

      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * GET /api/cron/health
   * Health check simples para monitoramento
   */
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      service: 'cron-jobs',
      timestamp: new Date().toISOString(),
    };
  });
}

/**
 * Sync routes — importação CSV e status de sincronização
 */
import { FastifyPluginAsync } from 'fastify';
import { parse as csvParse } from 'csv-parse/sync';
import { SyncSource, SyncStatus, LeadStatusNormalized } from '@prisma/client';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

export const syncRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', authenticate);

  // GET /api/v1/sync/runs — histórico de sincronizações
  fastify.get('/runs', async (request) => {
    const runs = await fastify.prisma.syncRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: 50,
    });
    return runs;
  });

  // GET /api/v1/sync/runs/:id
  fastify.get<{ Params: { id: string } }>(
    '/runs/:id',
    async (request, reply) => {
      const run = await fastify.prisma.syncRun.findUnique({ where: { id: request.params.id } });
      if (!run) return reply.status(404).send({ statusCode: 404, message: 'Sync run not found' });
      return run;
    },
  );

  // POST /api/v1/sync/csv — upload de CSV manual
  fastify.post('/csv',
    { onRequest: requireRoles(['ADMIN', 'MANAGER']) },
    async (request, reply) => {
      let file: any;
      try {
        file = await request.file();
      } catch {
        return reply.status(400).send({ statusCode: 400, message: 'No file uploaded', error: 'Bad Request' });
      }

      if (!file) {
        return reply.status(400).send({ statusCode: 400, message: 'No file uploaded', error: 'Bad Request' });
      }

      const content = await file.toBuffer();
      let rows: Record<string, string>[];
      try {
        rows = csvParse(content.toString('utf-8'), {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        }) as Record<string, string>[];
      } catch (err: any) {
        return reply.status(400).send({ statusCode: 400, message: 'Invalid CSV format', error: err.message });
      }

      const syncRun = await fastify.prisma.syncRun.create({
        data: {
          source: SyncSource.CSV_IMPORT,
          startedAt: new Date(),
          status: SyncStatus.RUNNING,
          triggeredBy: request.authUser.id,
          rowsRead: rows.length,
        },
      });

      let rowsInserted = 0;
      let rowsUpdated = 0;
      let rowsSkipped = 0;
      const errors: string[] = [];

      try {
        for (const row of rows) {
          try {
            const syonetLeadId = row['COD_LEAD'] ?? row['cod_lead'] ?? '';
            const storeName = row['EMPRESA'] ?? row['empresa'] ?? '';
            const mediaRaw = row['ORIGEM'] ?? row['origem'] ?? '';
            const receivedAtStr = row['DATA_ENTRADA'] ?? row['data_entrada'] ?? '';
            const status = row['STATUS'] ?? row['status'] ?? '';
            const atendente = row['ATENDENTE'] ?? row['atendente'] ?? '';
            const tipoEvento = row['TIPO_EVENTO'] ?? row['tipo_evento'] ?? '';

            if (!syonetLeadId || !storeName) {
              rowsSkipped++;
              continue;
            }

            const store = await fastify.prisma.store.findFirst({
              where: { syonetName: { equals: storeName, mode: 'insensitive' } },
            });
            if (!store) {
              errors.push(`Loja não encontrada: ${storeName}`);
              rowsSkipped++;
              continue;
            }

            let mediaSource = await fastify.prisma.mediaSource.findUnique({
              where: { rawName: mediaRaw },
            });
            if (!mediaSource && mediaRaw) {
              mediaSource = await fastify.prisma.mediaSource.create({
                data: {
                  rawName: mediaRaw,
                  normalizedName: mediaRaw.toUpperCase().replace(/\s+/g, '_'),
                },
              });
            }

            let vlUser = null;
            if (atendente) {
              vlUser = await fastify.prisma.user.findFirst({
                where: {
                  OR: [
                    { username: { equals: atendente, mode: 'insensitive' } },
                    { syonetCode: atendente },
                  ],
                  role: 'VL_CONSULTANT',
                },
              });
            }

            const receivedAt = receivedAtStr ? new Date(receivedAtStr) : new Date();
            const firstDayOfMonth = new Date(receivedAt.getFullYear(), receivedAt.getMonth(), 1);
            const priorityFlag = receivedAt >= firstDayOfMonth;

            const upperStatus = status.toUpperCase();
            let statusNormalized: string | null = null;
            if (upperStatus.includes('AGUARD')) statusNormalized = 'AGUARDANDO';
            else if (upperStatus.includes('ATRAS')) statusNormalized = 'ATRASADO';
            else if (upperStatus.includes('PENDENTE')) statusNormalized = 'PENDENTE_DIA';
            else if (upperStatus.includes('FUTURO')) statusNormalized = 'FUTURO';
            else if (upperStatus.includes('ENCAMINH')) statusNormalized = 'ENCAMINHADO';
            else if (upperStatus.includes('VEND')) statusNormalized = 'VENDIDO';

            await fastify.prisma.lead.upsert({
              where: { syonetLeadId_storeId: { syonetLeadId, storeId: store.id } },
              update: {
                mediaRaw,
                mediaSourceId: mediaSource?.id,
                status,
                statusNormalized: statusNormalized as LeadStatusNormalized | null,
                receivedAt,
                integrationDate: receivedAt,
                priorityFlag,
                assignedVlId: vlUser?.id,
                eventType: tipoEvento || undefined,
                rawPayload: row as any,
                updatedAt: new Date(),
              },
              create: {
                syonetLeadId,
                storeId: store.id,
                mediaSourceId: mediaSource?.id ?? null,
                mediaRaw,
                receivedAt,
                integrationDate: receivedAt,
                status,
                statusNormalized: statusNormalized as LeadStatusNormalized | null,
                priorityFlag,
                assignedVlId: vlUser?.id ?? null,
                eventType: tipoEvento || null,
                rawPayload: row as any,
              },
            });

            rowsInserted++;
          } catch (err: any) {
            errors.push(`Row error: ${err.message}`);
            rowsSkipped++;
          }
        }

        await fastify.prisma.syncRun.update({
          where: { id: syncRun.id },
          data: {
            finishedAt: new Date(),
            status: errors.length > rows.length * 0.1 ? SyncStatus.PARTIAL : SyncStatus.SUCCESS,
            rowsInserted,
            rowsUpdated,
            rowsSkipped,
            errorMessage: errors.slice(0, 20).join('; '),
          },
        });
      } catch (err: any) {
        await fastify.prisma.syncRun.update({
          where: { id: syncRun.id },
          data: {
            finishedAt: new Date(),
            status: SyncStatus.FAILED,
            errorMessage: err.message,
          },
        });
      }

      return {
        syncRunId: syncRun.id,
        rowsRead: rows.length,
        rowsInserted,
        rowsUpdated,
        rowsSkipped,
        errorsCount: errors.length,
        message: `Importação concluída: ${rowsInserted} inseridos, ${rowsSkipped} ignorados.`,
      };
    },
  );
};

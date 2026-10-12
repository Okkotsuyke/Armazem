/**
 * Routes: Leads
 *
 * Endpoints para gerenciamento de leads
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.middleware';
import { attachAssignees } from '../services/lead-assignees';

export async function leadRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', authenticate);

  /**
   * GET /api/v1/leads
   * Lista leads com filtros
   */
  fastify.get('/', async (request, reply) => {
    try {
      const query = request.query as {
        storeId?: string;
        status?: string;
        vlUserId?: string;
        startDate?: string;
        endDate?: string;
        limit?: string;
        offset?: string;
      };

      const where: any = {};

      if (query.storeId) where.storeId = query.storeId;
      if (query.vlUserId) where.assignedVlId = query.vlUserId;
      if (query.status) where.statusNormalized = query.status;

      if (query.startDate || query.endDate) {
        where.receivedAt = {};
        if (query.startDate) where.receivedAt.gte = new Date(query.startDate);
        if (query.endDate) where.receivedAt.lte = new Date(query.endDate);
      }

      const limit = Math.min(parseInt(query.limit || '50'), 200);
      const offset = parseInt(query.offset || '0');

      const [leads, total] = await Promise.all([
        fastify.prisma.lead.findMany({
          where,
          include: {
            store: true,
            mediaSource: true,
          },
          orderBy: { receivedAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        fastify.prisma.lead.count({ where }),
      ]);

      return {
        success: true,
        data: {
          leads: await attachAssignees(fastify.prisma, leads),
          total,
          limit,
          offset,
          hasMore: offset + leads.length < total,
        },
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Erro ao listar leads',
      });
    }
  });

  /**
   * GET /api/v1/leads/:id
   * Detalhes de um lead específico
   */
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const lead = await fastify.prisma.lead.findUnique({
        where: { id },
        include: {
          store: true,
          mediaSource: true,
          leadEvents: {
            orderBy: { eventDate: 'desc' },
            include: {
              user: { select: { id: true, name: true, username: true } },
            },
          },
          appointments: {
            orderBy: { appointmentDate: 'desc' },
          },
          sale: true,
        },
      });

      if (!lead) {
        return reply.status(404).send({
          success: false,
          error: 'Lead não encontrado',
        });
      }

      const [leadWithAssignees] = await attachAssignees(fastify.prisma, [lead]);

      return {
        success: true,
        data: leadWithAssignees,
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Erro ao buscar lead',
      });
    }
  });

  /**
   * PUT /api/v1/leads/:id
   * Atualiza um lead (apenas campos permitidos)
   */
  fastify.put('/:id',
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = request.body as {
          statusNormalized?: string;
          priorityFlag?: boolean;
          assignedVlId?: string;
          assignedVsId?: string;
          assignedBdcId?: string;
        };

        // Campos que podem ser atualizados
        const updateData: any = {};
        if (body.statusNormalized !== undefined) {
          updateData.statusNormalized = body.statusNormalized;
          updateData.status = body.statusNormalized;
        }
        if (body.priorityFlag !== undefined) updateData.priorityFlag = body.priorityFlag;
        if (body.assignedVlId !== undefined) updateData.assignedVlId = body.assignedVlId;
        if (body.assignedVsId !== undefined) updateData.assignedVsId = body.assignedVsId;
        if (body.assignedBdcId !== undefined) updateData.assignedBdcId = body.assignedBdcId;

        const lead = await fastify.prisma.lead.update({
          where: { id },
          data: updateData,
          include: {
            store: true,
            mediaSource: true,
          },
        });

        // Registrar evento de atualização
        await fastify.prisma.leadEvent.create({
          data: {
            leadId: id,
            eventType: 'UPDATED',
            eventDate: new Date(),
            userId: request.authUser.id,
            description: `Lead atualizado por ${request.authUser.username}`,
          },
        });

        const [leadWithAssignees] = await attachAssignees(fastify.prisma, [lead]);

        return {
          success: true,
          data: leadWithAssignees,
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          success: false,
          error: 'Erro ao atualizar lead',
        });
      }
    }
  );

  /**
   * POST /api/v1/leads/:id/events
   * Adiciona um evento ao histórico do lead
   */
  fastify.post('/:id/events',
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = request.body as {
          eventType: string;
          description?: string;
        };

        const event = await fastify.prisma.leadEvent.create({
          data: {
            leadId: id,
            eventType: body.eventType,
            eventDate: new Date(),
            userId: request.authUser.id,
            description: body.description,
          },
          include: {
            user: { select: { id: true, name: true, username: true } },
          },
        });

        return reply.status(201).send({
          success: true,
          data: event,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          success: false,
          error: 'Erro ao criar evento',
        });
      }
    }
  );

  /**
   * GET /api/v1/leads/stats/portfolio
   * Estatísticas de portfolio para VL
   */
  fastify.get('/stats/portfolio', async (request, reply) => {
    try {
      const userId = request.authUser.role === 'VL_CONSULTANT'
        ? request.authUser.id
        : (request.query as any).userId;

      if (!userId) {
        return reply.status(400).send({
          success: false,
          error: 'userId é obrigatório',
        });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [total, byStatus, todayAppointments] = await Promise.all([
        fastify.prisma.lead.count({ where: { assignedVlId: userId } }),
        fastify.prisma.lead.groupBy({
          by: ['statusNormalized'],
          where: { assignedVlId: userId },
          _count: true,
        }),
        fastify.prisma.appointment.count({
          where: {
            lead: { assignedVlId: userId },
            appointmentDate: {
              gte: today,
              lt: tomorrow,
            },
          },
        }),
      ]);

      const stats = {
        total,
        byStatus: byStatus.reduce((acc, item) => {
          acc[item.statusNormalized || 'SEM_STATUS'] = item._count;
          return acc;
        }, {} as Record<string, number>),
        todayAppointments,
        aguardando: byStatus.find(s => s.statusNormalized === 'AGUARDANDO')?._count || 0,
        atrasado: byStatus.find(s => s.statusNormalized === 'ATRASADO')?._count || 0,
        pendenteDia: byStatus.find(s => s.statusNormalized === 'PENDENTE_DIA')?._count || 0,
        futuro: byStatus.find(s => s.statusNormalized === 'FUTURO')?._count || 0,
        vendido: byStatus.find(s => s.statusNormalized === 'VENDIDO')?._count || 0,
      };

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Erro ao buscar estatísticas',
      });
    }
  });
}

export default leadRoutes;

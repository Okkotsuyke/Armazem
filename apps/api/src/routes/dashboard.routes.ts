/**
 * Dashboard routes — KPIs principais
 */
import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { dashboardService } from '../services/dashboard.service';
import { authenticate } from '../middleware/auth.middleware';

const FiltersQuerySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  granularity: z.enum(['day', 'month', 'year']).optional().default('day'),
  plaza: z.enum(['FORTALEZA', 'SALVADOR', 'ALL']).optional().default('ALL'),
  storeIds: z.string().optional(), // csv: "uuid1,uuid2"
  mediaIds: z.string().optional(),
  vlUserIds: z.string().optional(),
  vsUserIds: z.string().optional(),
  eventTypes: z.string().optional(),
});

function parseCsv(str: string | undefined): string[] | undefined {
  if (!str) return undefined;
  return str.split(',').map(s => s.trim()).filter(Boolean);
}

export const dashboardRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', authenticate);

  // GET /api/v1/dashboard/overview
  fastify.get('/overview', async (request) => {
    const q = FiltersQuerySchema.parse(request.query);
    const filters = {
      startDate: q.startDate,
      endDate: q.endDate,
      granularity: q.granularity,
      plaza: q.plaza,
      storeIds: parseCsv(q.storeIds),
      mediaIds: parseCsv(q.mediaIds),
      vlUserIds: parseCsv(q.vlUserIds),
      vsUserIds: parseCsv(q.vsUserIds),
      eventTypes: parseCsv(q.eventTypes),
    };
    return dashboardService.getOverview(fastify.prisma, filters, request.authUser);
  });

  // GET /api/v1/dashboard/by-store
  fastify.get('/by-store', async (request) => {
    const q = FiltersQuerySchema.parse(request.query);
    const filters = {
      startDate: q.startDate,
      endDate: q.endDate,
      granularity: q.granularity,
      plaza: q.plaza,
      storeIds: parseCsv(q.storeIds),
      mediaIds: parseCsv(q.mediaIds),
      vlUserIds: parseCsv(q.vlUserIds),
      vsUserIds: parseCsv(q.vsUserIds),
      eventTypes: parseCsv(q.eventTypes),
    };
    return dashboardService.getByStore(fastify.prisma, filters, request.authUser);
  });

  // GET /api/v1/dashboard/by-media
  fastify.get('/by-media', async (request) => {
    const q = FiltersQuerySchema.parse(request.query);
    const filters = {
      startDate: q.startDate,
      endDate: q.endDate,
      granularity: q.granularity,
      plaza: q.plaza,
      storeIds: parseCsv(q.storeIds),
      mediaIds: parseCsv(q.mediaIds),
      vlUserIds: parseCsv(q.vlUserIds),
      vsUserIds: parseCsv(q.vsUserIds),
      eventTypes: parseCsv(q.eventTypes),
    };
    return dashboardService.getByMedia(fastify.prisma, filters, request.authUser);
  });

  // GET /api/v1/dashboard/by-consultant
  fastify.get('/by-consultant', async (request) => {
    const q = FiltersQuerySchema.parse(request.query);
    const filters = {
      startDate: q.startDate,
      endDate: q.endDate,
      granularity: q.granularity,
      plaza: q.plaza,
      storeIds: parseCsv(q.storeIds),
      mediaIds: parseCsv(q.mediaIds),
      vlUserIds: parseCsv(q.vlUserIds),
      vsUserIds: parseCsv(q.vsUserIds),
      eventTypes: parseCsv(q.eventTypes),
    };
    return dashboardService.getByConsultant(fastify.prisma, filters, request.authUser);
  });

  // GET /api/v1/dashboard/by-seller
  fastify.get('/by-seller', async (request) => {
    const q = FiltersQuerySchema.parse(request.query);
    const filters = {
      startDate: q.startDate,
      endDate: q.endDate,
      granularity: q.granularity,
      plaza: q.plaza,
      storeIds: parseCsv(q.storeIds),
      mediaIds: parseCsv(q.mediaIds),
      vlUserIds: parseCsv(q.vlUserIds),
      vsUserIds: parseCsv(q.vsUserIds),
      eventTypes: parseCsv(q.eventTypes),
    };
    return dashboardService.getBySeller(fastify.prisma, filters, request.authUser);
  });
};

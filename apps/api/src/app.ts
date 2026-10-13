/**
 * Fastify instance — CRM EUROVIA API
 * Fastify v5 com JWT + Prisma
 */
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { prismaPlugin } from './plugins/prisma.plugin';
import sentryPlugin from './plugins/sentry.plugin';
import { authRoutes } from './routes/auth.routes';
import { storeRoutes } from './routes/store.routes';
import { userRoutes } from './routes/user.routes';
import { mediaSourceRoutes } from './routes/media-source.routes';
import { dashboardRoutes } from './routes/dashboard.routes';
import { productivityRoutes } from './routes/productivity.routes';
import { syncRoutes } from './routes/sync.routes';
import { syonetSyncRoutes } from './routes/syonet-sync.routes';
import { syonetDashboardRoutes } from './routes/syonet-dashboard.routes';
import { leadRoutes } from './routes/lead.routes';
import { appointmentRoutes } from './routes/appointment.routes';
import { analyticsRoutes } from './routes/analytics.routes';
import { dashboardAuthRoutes } from './routes/dashboard-auth.routes';
import { validationRoutes } from './routes/validation.routes';
import { cronRoutes } from './routes/cron.routes';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '@prisma/client';

// ── Auth user type ────────────────────────────────────────────
export type AuthUser = {
  id: string;
  username: string;
  role: UserRole;
  storeId: string | null;
};

export type DashboardRole = 'ADMIN' | 'VIEWER';

export type DashboardAuthUser = {
  id: string;
  username: string;
  name: string;
  role: DashboardRole;
};

declare module 'fastify' {
  interface FastifyRequest {
    /** Authenticated user — populado pelo hook authenticate */
    authUser: AuthUser;
    /** Usuário do dashboard analítico — populado pelo hook authenticateDashboard */
    dashboardUser: DashboardAuthUser;
  }
}

type TokenPayload = { type?: 'refresh' | 'dashboard' };

function unauthorized(reply: FastifyReply) {
  return reply.status(401).send({
    statusCode: 401,
    message: 'Unauthorized',
    error: 'Invalid or expired token',
  });
}

/**
 * Middleware de autenticação — extrai JWT e popula request.authUser
 * Usado como onRequest em rotas protegidas
 */
async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  let decoded: AuthUser & TokenPayload;
  try {
    decoded = await request.jwtVerify<AuthUser & TokenPayload>();
  } catch {
    return unauthorized(reply);
  }
  // Refresh tokens e tokens do dashboard analítico são assinados com o mesmo segredo
  if (decoded.type) return unauthorized(reply);
  request.authUser = decoded;
}

/**
 * Middleware de autenticação do dashboard analítico — aceita apenas tokens type=dashboard
 */
async function authenticateDashboard(request: FastifyRequest, reply: FastifyReply) {
  let decoded: DashboardAuthUser & TokenPayload;
  try {
    decoded = await request.jwtVerify<DashboardAuthUser & TokenPayload>();
  } catch {
    return unauthorized(reply);
  }
  if (decoded.type !== 'dashboard') return unauthorized(reply);
  request.dashboardUser = decoded;
}

function requireDashboardRoles(roles: DashboardRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.dashboardUser;
    if (!user || !roles.includes(user.role)) {
      return reply.status(403).send({
        statusCode: 403,
        message: 'Forbidden',
        error: 'Insufficient permissions',
      });
    }
  };
}

/**
 * Middleware de roles — verifica se o usuário tem uma das roles permitidas
 */
function requireRoles(roles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.authUser;
    if (!user || !roles.includes(user.role)) {
      return reply.status(403).send({
        statusCode: 403,
        message: 'Forbidden',
        error: 'Insufficient permissions',
      });
    }
  };
}

export { authenticate, requireRoles, authenticateDashboard, requireDashboardRoles };

export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
  });

  // ── Plugins ──────────────────────────────────────────────
  await fastify.register(cors, {
    origin: process.env.NODE_ENV === 'production'
      ? ['https://crm.eurovia.com.br']
      : ['http://localhost:3000'],
    credentials: true,
  });

  // ── Validação de variáveis de ambiente críticas ──────────────
  const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL', 'SYONET_USERNAME', 'SYONET_PASSWORD'];
  const missingVars = requiredEnvVars.filter(v => !process.env[v]);

  if (missingVars.length > 0) {
    console.error(`❌ CRÍTICO: Variáveis de ambiente obrigatórias não definidas: ${missingVars.join(', ')}`);
    console.error('   Configure estas variáveis no ambiente de produção antes de iniciar a aplicação.');

    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Falta configuração: ${missingVars.join(', ')}`);
    }

    console.warn('⚠️  Modo desenvolvimento: usando valores padrão para variáveis ausentes');
  }

  // Validação específica do JWT_SECRET
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET,
    sign: { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' },
  });

  await fastify.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  // ── Rate limiting global ─────────────────────────────────────
  await fastify.register(rateLimit, {
    max: 500,  // 500 req/min para operações normais
    timeWindow: '1 minute',
  });

  await fastify.register(prismaPlugin);
  await fastify.register(sentryPlugin);

  // ── Health check com verificação de DB ─────────────────────────────────────
  fastify.get('/health', async (request, reply) => {
    let dbStatus = 'disconnected';
    let dbLatency = null;

    try {
      const start = Date.now();
      await fastify.prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - start;
      dbStatus = 'connected';
    } catch (error) {
      request.log.error({ error }, 'Health check: DB connection failed');
    }

    return {
      status: dbStatus === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '0.1.0',
      environment: process.env.NODE_ENV ?? 'development',
      integrations: {
        database: dbStatus,
        dbLatency: dbLatency,
      },
    };
  });

  // ── Cron Jobs (sem autenticação - verificado pela Vercel) ──
  await fastify.register(cronRoutes, { prefix: '/api/cron' });

  // Decorar para uso nos route files — ANTES de registrar rotas que usam auth
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (fastify as any).authenticate = authenticate;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (fastify as any).requireRoles = requireRoles;

  // ── Routes ──────────────────────────────────────────────
  await fastify.register(authRoutes, { prefix: '/api/v1/auth' });

  await fastify.register(storeRoutes, { prefix: '/api/v1/stores' });
  await fastify.register(userRoutes, { prefix: '/api/v1/users' });
  await fastify.register(mediaSourceRoutes, { prefix: '/api/v1/media-sources' });
  await fastify.register(dashboardRoutes, { prefix: '/api/v1/dashboard' });
  await fastify.register(productivityRoutes, { prefix: '/api/v1/productivity' });
  await fastify.register(syncRoutes, { prefix: '/api/v1/sync' });

  // ── Analytics & Dashboard Auth ─────────────────────────────
  await fastify.register(analyticsRoutes, { prefix: '/api/v1/analytics' });
  await fastify.register(dashboardAuthRoutes, { prefix: '/api/v1/dashboard/auth' });
  await fastify.register(validationRoutes, { prefix: '/api/v1/dashboard/validation' });

  // ── Syonet Sync ─────────────────────────────────────────────
  await fastify.register(syonetSyncRoutes, { prefix: '/api/v1/syonet-sync' });

  // ── Syonet Dashboard (consulta direta) ───────────────────────
  await fastify.register(syonetDashboardRoutes, { prefix: '/api/v1/syonet-dashboard' });

  // ── Leads ───────────────────────────────────────────────────
  await fastify.register(leadRoutes, { prefix: '/api/v1/leads' });

  // ── Appointments ────────────────────────────────────────────
  await fastify.register(appointmentRoutes, { prefix: '/api/v1/appointments' });

  return fastify;
}

/**
 * Sentry Plugin - CRM EUROVIA
 * Error tracking e performance monitoring
 */
import fp from 'fastify-plugin';
import * as Sentry from '@sentry/node';
import type { FastifyInstance } from 'fastify';

// Extensao do modulo Fastify para incluir cliente Sentry
declare module 'fastify' {
  interface FastifyInstance {
    sentry: typeof Sentry;
  }
}

async function sentryPlugin(fastify: FastifyInstance) {
  // Verifica se Sentry esta configurado
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    fastify.log.warn('Sentry DSN nao configurado - tracing desabilitado');
    // Decorate anyway with a no-op to prevent crashes
    fastify.decorate('sentry', Sentry);
    return;
  }

  // Inicializa o Sentry com API v11
  Sentry.init({
    dsn,

    // Environment
    environment: process.env.NODE_ENV || 'development',

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Error sampling
    sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  });

  // Decorate fastify instance with Sentry
  fastify.decorate('sentry', Sentry);

  // Request handlers
  fastify.addHook('onRequest', async (request) => {
    // Inicia um transaction span para cada request
    const transaction = Sentry.startInactiveSpan({
      name: `${request.method} ${request.url}`,
      op: 'http.server',
    });

    // Armazena no request para uso posterior
    (request as any).__transaction = transaction;
  });

  fastify.addHook('onResponse', async (request, _reply) => {
    const transaction = (request as any).__transaction;
    if (transaction) {
      transaction.end();
    }
  });

  // Captura erros nao tratados
  fastify.addHook('onError', async (request, _reply, error) => {
    const transaction = (request as any).__transaction;

    Sentry.withScope((scope) => {
      // Adiciona contexto do request
      scope.addEventProcessor((event) => {
        event.request = {
          url: request.url,
          method: request.method,
          headers: sanitizeHeaders(request.headers),
        };
        return event;
      });

      // Adiciona dados do usuario autenticado se disponivel
      if ((request as any).authUser) {
        scope.setUser({
          id: (request as any).authUser.id,
          username: (request as any).authUser.username,
        });
      }

      // Tags uteis para filtrar
      const route = (request as any).routeOptions?.url || 'unknown';
      if (route) {
        scope.setTag('route', route);
      }

      // Captura o erro
      scope.captureException(error);
      void transaction; // mark as intentionally unused
    });
  });

  // Error handler global
  fastify.setErrorHandler((error, request, reply) => {
    // Log local
    fastify.log.error(error);

    // Captura no Sentry (exceto erros de validacao comuns)
    if (!isCommonError(error)) {
      Sentry.captureException(error, {
        contexts: {
          request: {
            url: request.url,
            method: request.method,
          },
        },
      });
    }

    // Resposta formatada
    const statusCode = error.statusCode || 500;
    reply.status(statusCode).send({
      statusCode,
      error: error.name || 'Internal Server Error',
      message: statusCode < 500 ? error.message : 'Erro interno do servidor',
    });
  });

  // Hook de shutdown
  fastify.addHook('onClose', async () => {
    // Garante que eventos pendentes sao enviados antes de encerrar
    await Sentry.flush(2000);
  });

  fastify.log.info('Sentry configurado e ativo');
}

// Helper: Remove headers sensiveis
function sanitizeHeaders(headers: Record<string, unknown>): Record<string, string> {
  const sensitiveKeys = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (sensitiveKeys.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = String(value);
    }
  }

  return sanitized;
}

// Helper: Erros comuns que nao precisam de tracking
function isCommonError(error: unknown): boolean {
  const errorObj = error as { code?: string; statusCode?: number };
  const commonCodes = [
    'FST_ERR_VALIDATION',
    'FST_ERR_NOT_FOUND',
    'FST_ERR_BAD_REQUEST',
    'FST_JWT_NO_AUTHORIZATION_IN_HEADER',
    'FST_JWT_AUTHORIZATION_TOKEN_INVALID',
    'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED',
    'FST_JWT_AUTHORIZATION_TOKEN_INVALID',
  ];

  return commonCodes.includes(errorObj.code || '') || (errorObj.statusCode || 0) < 400;
}

export default fp(sentryPlugin, {
  name: 'sentry',
  fastify: '4.x',
});

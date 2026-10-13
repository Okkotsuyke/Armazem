/**
 * Vercel Serverless Handler - CRM EUROVIA API
 * Adaptador para Fastify rodar como serverless na Vercel
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import { buildApp } from './app';
import type { FastifyRequest } from 'fastify';

// Cache da instância Fastify para reuse entre invocações (cold start optimization)
let fastifyInstance: Awaited<ReturnType<typeof buildApp>> | null = null;

async function getFastify() {
  if (!fastifyInstance) {
    fastifyInstance = await buildApp();
  }
  return fastifyInstance;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const fastify = await getFastify();

    // Adaptar request para Fastify inject
    const injectOptions = {
      method: req.method as any,
      url: req.url,
      headers: req.headers as any,
      body: req.body,
      query: req.query as any,
    };

    // Usar inject do Fastify para processar a requisição
    const response = await fastify.inject(injectOptions);

    // Copiar status
    res.status(response.statusCode);

    // Copiar headers
    Object.entries(response.headers).forEach(([key, value]) => {
      if (value) res.setHeader(key, value as string);
    });

    // Enviar resposta
    res.send(response.body);
  } catch (error: any) {
    console.error('Error handling request:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error?.message || 'Unknown error'
    });
  }
}

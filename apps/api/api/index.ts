// Serverless handler for Vercel — CRM EUROVIA API
// Uses fastify.inject() to handle requests without listening on a port.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildApp } from '../src/app';

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
    const response = await fastify.inject({
      method: req.method as any,
      url: req.url ?? '/',
      headers: req.headers as any,
      // @ts-ignore - body is parsed by Vercel
      payload: typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {}),
      query: req.query as any,
    });

    res.status(response.statusCode);
    Object.entries(response.headers).forEach(([key, value]) => {
      if (value) res.setHeader(key, value as string | string[]);
    });
    res.send(response.body);
  } catch (error: any) {
    console.error('[api/index] Error handling request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error?.message ?? 'Unknown error',
      });
    }
  }
}

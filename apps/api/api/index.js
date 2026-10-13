// Vercel Serverless Handler - Fastify via inject()
// Build output: tsc compila para dist/api/index.js (serverless entrypoint)
import { buildApp } from '../src/app.js';

let fastifyInstance = null;
let initPromise = null;

async function getFastify() {
  if (fastifyInstance) return fastifyInstance;
  if (!initPromise) {
    initPromise = buildApp()
      .then((app) => {
        fastifyInstance = app;
        return app;
      })
      .catch((err) => {
        initPromise = null;
        throw err;
      });
  }
  return initPromise;
}

export default async function handler(req, res) {
  try {
    const fastify = await getFastify();
    const response = await fastify.inject({
      method: req.method,
      url: req.url ?? '/',
      headers: req.headers,
      payload: req.body,
      query: req.query,
    });

    res.status(response.statusCode);
    if (response.headers) {
      for (const [key, value] of Object.entries(response.headers)) {
        if (value !== undefined && value !== null) {
          res.setHeader(key, String(value));
        }
      }
    }
    const body = response.body ?? '';
    res.send(typeof body === 'string' ? body : Buffer.from(body));
  } catch (error) {
    console.error('[vercel-handler] Error handling request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error?.message ?? 'Unknown error',
      });
    }
  }
}

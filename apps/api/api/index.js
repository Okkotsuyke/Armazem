/**
 * Vercel Serverless Function
 * Handler para todas as rotas da API
 */
const { buildApp } = require('../dist/app');

// Cache da instância do Fastify
let fastifyInstance = null;

/**
 * Inicializa e cacheia a instância do Fastify
 */
async function getFastify() {
  if (!fastifyInstance) {
    fastifyInstance = await buildApp();
    await fastifyInstance.ready();
  }
  return fastifyInstance;
}

/**
 * Handler principal da serverless function
 */
module.exports = async (req, res) => {
  try {
    const fastify = await getFastify();

    // Converter a requisição Vercel para formato Fastify
    // O Fastify usa um formato diferente de request/response
    const { parse } = require('url');
    const url = parse(req.url, true);

    // Criar resposta mock
    let responseBody = '';
    let responseStatus = 200;
    let responseHeaders = {};

    // Mock do response para capturar a saída
    const mockRes = {
      status: (code) => {
        responseStatus = code;
        return mockRes;
      },
      send: (body) => {
        responseBody = typeof body === 'object' ? JSON.stringify(body) : String(body);
        return mockRes;
      },
      json: (body) => {
        responseBody = JSON.stringify(body);
        return mockRes;
      },
      setHeader: (key, value) => {
        responseHeaders[key] = value;
        return mockRes;
      },
      end: () => {
        // Response completa
        res.statusCode = responseStatus;
        Object.entries(responseHeaders).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
        res.end(responseBody);
      }
    };

    // Criar request no formato Fastify
    const request = Object.assign(req, {
      url: url.pathname + url.search,
      params: {},
      query: url.query || {},
      body: req.body || {},
      ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '127.0.0.1',
      hostname: req.headers.host,
    });

    // Processar com Fastify
    await fastify.handle(request, mockRes);

    return { req, res };
  } catch (error) {
    console.error('Error handling request:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
    return { req, res };
  }
};

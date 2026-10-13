/**
 * Teste local do handler serverless (simula o que a Vercel faz em produção).
 * Roda o handler com req/res mock e valida que o Fastify responde.
 */
import handler from '../api/index';

// Mock mínimo de req/res compatível com @vercel/node
function makeMockReqRes(method: string, url: string, body?: any) {
  const headers: Record<string, string> = {};
  const req = {
    method,
    url,
    headers,
    body,
    query: {},
  };
  let statusCode = 200;
  const resHeaders: Record<string, string> = {};
  const res = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    setHeader(key: string, value: string) {
      resHeaders[key] = value;
    },
    json(payload: any) {
      resHeaders['content-type'] = 'application/json';
      res.send(JSON.stringify(payload));
      return res;
    },
    send(body: any) {
      console.log(`\n=== ${method} ${url} ===`);
      console.log('status:', statusCode);
      console.log('headers:', resHeaders);
      console.log('body:', typeof body === 'string' ? body.slice(0, 500) : body);
    },
  };
  return { req: req as any, res: res as any };
}

async function main() {
  console.log('Testando handler serverless localmente...');

  // 1. Health check
  const { req: r1, res: s1 } = makeMockReqRes('GET', '/health');
  await handler(r1, s1);

  // 2. Rota inexistente (deve dar 404)
  const { req: r2, res: s2 } = makeMockReqRes('GET', '/rota-que-nao-existe');
  await handler(r2, s2);

  console.log('\n✓ Handler respondeu sem crash');
}

main().catch((e) => {
  console.error('✗ Handler explodiu:', e);
  process.exit(1);
});

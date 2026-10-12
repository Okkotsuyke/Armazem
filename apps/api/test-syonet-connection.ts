/**
 * Script de teste para conexão com o CRM Syonet
 *
 * Uso: npx ts-node test-syonet-connection.ts
 */

import { chromium } from 'playwright';
import * as fs from 'fs';

const SYONET_URL = 'https://viasul.syonet.com';
const USERNAME = 'camila.brito';
const PASSWORD = 'C@mila1234';

async function testConnection() {
  console.log('🧪 Testando conexão com Syonet CRM...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Login
    console.log('1️⃣ Fazendo login...');
    await page.goto(`${SYONET_URL}/portal/app.do?modulo=login#/login`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await page.waitForSelector('#login', { timeout: 30000 });
    await page.fill('#login', USERNAME);
    await page.fill('#password', PASSWORD);
    await page.click('button:has-text("Entrar")');

    await page.waitForURL('**/acessaSistema.do**', { timeout: 30000 });
    await page.waitForTimeout(10000);

    console.log('✅ Login realizado com sucesso!\n');

    // 2. Obter cookies
    const cookies = await context.cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    console.log('2️⃣ Cookies de sessão obtidos\n');

    // 3. Testar API endpoints
    console.log('3️⃣ Testando endpoints da API...\n');

    const endpoints = [
      { url: '/api/dashboard', desc: 'Dashboards' },
      { url: '/api/empresa', desc: 'Empresas' },
      { url: '/api/usuario', desc: 'Usuários' },
      { url: '/api/funil', desc: 'Funil' },
    ];

    for (const ep of endpoints) {
      try {
        const response = await page.evaluate(async (params: { url: string; cookie: string }) => {
          const res = await fetch('https://viasul.syonet.com' + params.url, {
            headers: { 'Cookie': params.cookie, 'Accept': 'application/json' }
          });
          return { status: res.status, length: res.headers.get('content-length') || 'unknown' };
        }, { url: ep.url, cookie: cookieHeader });

        console.log(`   ✓ ${ep.desc} (${ep.url}): HTTP ${response.status}`);
      } catch (err) {
        console.log(`   ✗ ${ep.desc} (${ep.url}): ERRO - ${err}`);
      }
    }

    // 4. Obter lista de dashboards
    console.log('\n4️⃣ Listando dashboards disponíveis...\n');
    const dashboards = await page.evaluate(async (cookie: string) => {
      const res = await fetch('https://viasul.syonet.com/api/dashboard', {
        headers: { 'Cookie': cookie }
      });
      const data = await res.json() as any[];
      return data.slice(0, 20).map((d) => ({ id: d.idDashboard, nome: d.nome }));
    }, cookieHeader);

    dashboards.forEach((d) => {
      console.log(`   📊 ${d.id}: ${d.nome}`);
    });

    // 5. Obter empresas
    console.log('\n5️⃣ Listando empresas...\n');
    const empresas = await page.evaluate(async (cookie: string) => {
      const res = await fetch('https://viasul.syonet.com/api/empresa', {
        headers: { 'Cookie': cookie }
      });
      const data = await res.json() as any[];
      return data.slice(0, 20).map((e) => ({
        id: e.idEmpresa,
        nome: e.apelido,
        marca: e.marcaBandeira
      }));
    }, cookieHeader);

    empresas.forEach((e) => {
      console.log(`   🏪 ${e.id}: ${e.nome} (${e.marca})`);
    });

    // 6. Salvar cookies para uso futuro
    fs.writeFileSync('./syonet_session.json', JSON.stringify(cookies, null, 2));
    console.log('\n6️⃣ Cookies salvos em syonet_session.json\n');

    console.log('✅ Teste concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testConnection();

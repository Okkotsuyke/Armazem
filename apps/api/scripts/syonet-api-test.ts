/**
 * Script para testar APIs do Syonet após login
 */

import { chromium } from 'playwright';

const SYONET_URL = 'https://viasul.syonet.com';
const USERNAME = 'camila.brito';
const PASSWORD = 'C@mila1234';

async function main() {
  console.log('\n🔵 Syonet API Testing\n');

  const browser = await chromium.launch({
    headless: false,
  });

  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
  });

  const page = await context.newPage();

  try {
    // LOGIN
    console.log('1️⃣ Fazendo login...');
    await page.goto(SYONET_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.waitForTimeout(18000);

    const inputs = await page.$$('input');
    await inputs[0].fill(USERNAME);
    await inputs[1].fill(PASSWORD);

    const enterBtn = await page.$('button:has-text("Entrar")');
    if (enterBtn) await enterBtn.click();

    await page.waitForTimeout(10000);
    console.log(`   URL: ${page.url()}\n`);

    // Obter cookies
    const cookies = await context.cookies();
    const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    // Testar APIs
    console.log('2️⃣ Testando APIs...\n');

    const endpoints = [
      // Dashboards
      '/api/dashboard',
      '/api/dashboard/189',
      '/api/dashboard/162',
      '/api/dashboard/244',
      '/api/v1/dashboard',
      '/api/v1/dashboard/189',

      // Empresas
      '/api/empresa',
      '/api/v1/empresa',

      // Usuários
      '/api/usuario',
      '/api/v1/usuario',

      // Portal APIs
      '/portal/api/dashboard',
      '/portal/api/v1/dashboard',
      '/portal/api/empresa',

      // Oportunidades/Leads
      '/api/oportunidade',
      '/api/evento',
      '/api/v1/oportunidade',

      // Funil
      '/api/funil',
      '/api/v1/funil',

      // Produtividade
      '/api/produtividade',
      '/api/v1/produtividade',
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await page.evaluate(async (args) => {
          const res = await fetch(args.baseUrl + args.endpoint, {
            headers: {
              'Cookie': args.cookie,
              'Accept': 'application/json',
              'X-Requested-With': 'XMLHttpRequest',
            },
          });

          let data = null;
          try {
            const text = await res.text();
            if (text) {
              data = JSON.parse(text);
            }
          } catch {}

          return {
            status: res.status,
            ok: res.ok,
            dataKeys: data ? Object.keys(data).slice(0, 5) : null,
            dataLength: Array.isArray(data) ? data.length : null,
          };
        }, { baseUrl: SYONET_URL, endpoint, cookie: cookieStr });

        const statusIcon = response.ok ? '✅' : '❌';
        const keys = response.dataKeys ? `keys: ${response.dataKeys.join(', ')}` : '';
        const len = response.dataLength !== null ? `(${response.dataLength} items)` : '';
        console.log(`   ${statusIcon} ${endpoint}: ${response.status} ${keys} ${len}`);

      } catch (err) {
        console.log(`   ❌ ${endpoint}: Erro - ${err.message}`);
      }
    }

    console.log('\n3️⃣ Testando APIs com query params...\n');

    const paramEndpoints = [
      '/api/empresa?id=71',
      '/api/empresa?id=72',
      '/api/usuario?empresaId=71',
      '/api/oportunidade?empresaId=71&page=0&size=10',
      '/api/evento?page=0&size=20',
    ];

    for (const endpoint of paramEndpoints) {
      try {
        const response = await page.evaluate(async (args) => {
          const res = await fetch(args.baseUrl + args.endpoint, {
            headers: {
              'Cookie': args.cookie,
              'Accept': 'application/json',
            },
          });

          let data = null;
          try {
            const text = await res.text();
            if (text) {
              data = JSON.parse(text);
            }
          } catch {}

          return {
            status: res.status,
            ok: res.ok,
            preview: Array.isArray(data) ? data.slice(0, 2) : data,
          };
        }, { baseUrl: SYONET_URL, endpoint, cookie: cookieStr });

        const statusIcon = response.ok ? '✅' : '❌';
        console.log(`   ${statusIcon} ${endpoint}: ${response.status}`);
        if (response.preview) {
          console.log(`      Preview: ${JSON.stringify(response.preview).substring(0, 200)}`);
        }

      } catch (err) {
        console.log(`   ❌ ${endpoint}: Erro`);
      }
    }

    console.log('\n✅ Teste de APIs concluído!');

  } catch (err) {
    console.error('\n❌ Erro:', err.message);
  } finally {
    await browser.close();
  }
}

main();

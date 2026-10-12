#!/usr/bin/env node
/**
 * Execução de datasets do Syonet
 */

import { chromium } from 'playwright';

const SYONET_URL = process.env.SYONET_URL || 'https://viasul.syonet.com';
const USERNAME = process.env.SYONET_USERNAME || 'camila.brito';
const PASSWORD = process.env.SYONET_PASSWORD || 'C@mila1234';

async function main() {
  console.log('\n🔵 Executando Datasets do Syonet\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // LOGIN
    console.log('1️⃣ Login...');
    await page.goto(SYONET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(18000);

    const inputs = await page.$$('input');
    await inputs[0].fill(USERNAME);
    await inputs[1].fill(PASSWORD);

    const enterBtn = await page.$('button:has-text("Entrar")');
    if (enterBtn) await enterBtn.click();
    await page.waitForTimeout(10000);

    const cookies = await context.cookies();
    const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    console.log('✅ Login OK\n');

    // TENTAR EXECUTAR DATASET 664 COM PARÂMETROS
    console.log('2️⃣ Executando Dataset 664...\n');

    const endpoints = [
      '/api/dataset/664/execute',
      '/api/dataset/execute/664',
      '/api/dataset/664?page=0&size=100',
      '/api/dataset/664?empresaId=71',
      '/api/dataset/664/data',
      '/api/relatorio/664/execute',
    ];

    for (const ep of endpoints) {
      try {
        const res = await page.evaluate(async (args) => {
          const r = await fetch(args.baseUrl + args.ep, {
            headers: {
              'Cookie': args.cookie,
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
          });

          const text = await r.text();
          let data;
          try {
            data = JSON.parse(text);
          } catch {
            data = text.substring(0, 500);
          }

          return { status: r.status, ok: r.ok, preview: typeof data === 'object' ? JSON.stringify(data).substring(0, 300) : data };
        }, { baseUrl: SYONET_URL, ep, cookie: cookieStr });

        console.log(`   ${res.ok ? '✅' : '❌'} ${ep}: ${res.status}`);
        if (res.ok) {
          console.log(`      Preview: ${res.preview}`);
        }
      } catch (err) {
        console.log(`   ❌ ${ep}: ${err.message}`);
      }
    }

    // TENTAR DATASET COM POST
    console.log('\n3️⃣ Executando Dataset 664 via POST...\n');

    const postResult = await page.evaluate(async (args) => {
      try {
        const r = await fetch(args.baseUrl + '/api/dataset/664/execute', {
          method: 'POST',
          headers: {
            'Cookie': args.cookie,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            page: 0,
            size: 50,
            empresaIds: [71],
          }),
        });

        const text = await r.text();
        return { status: r.status, ok: r.ok, preview: text.substring(0, 500) };
      } catch (err) {
        return { error: err.message };
      }
    }, { baseUrl: SYONET_URL, cookie: cookieStr });

    console.log(JSON.stringify(postResult, null, 2));

    // TENTAR API DE EVENTOS/LEADS COM PARÂMETROS
    console.log('\n4️⃣ Testando API de Eventos com parâmetros...\n');

    const eventEndpoints = [
      '/api/evento?page=0&size=20',
      '/api/evento?empresaId=71&page=0&size=20',
      '/api/oportunidade?page=0&size=20',
      '/api/leads?page=0&size=20',
      '/api/lead?page=0&size=20',
    ];

    for (const ep of eventEndpoints) {
      try {
        const res = await page.evaluate(async (args) => {
          const r = await fetch(args.baseUrl + args.ep, {
            headers: { 'Cookie': args.cookie, 'Accept': 'application/json' },
          });
          return { status: r.status, ok: r.ok };
        }, { baseUrl: SYONET_URL, ep, cookie: cookieStr });

        console.log(`   ${res.ok ? '✅' : '❌'} ${ep}: ${res.status}`);
      } catch {
        console.log(`   ❌ ${ep}: Erro`);
      }
    }

    // TENTAR SYONET API GRAPHQL OU REST
    console.log('\n5️⃣ Testando Syonet API REST...\n');

    const restEndpoints = [
      '/api/v1/leads',
      '/api/v1/events',
      '/api/rest/dashboard',
      '/api/rest/empresa',
      '/rest/api/dashboard',
      '/portal/api/v1/dashboard',
    ];

    for (const ep of restEndpoints) {
      try {
        const res = await page.evaluate(async (args) => {
          const r = await fetch(args.baseUrl + args.ep, {
            headers: { 'Cookie': args.cookie, 'Accept': 'application/json' },
          });
          return { status: r.status, ok: r.ok };
        }, { baseUrl: SYONET_URL, ep, cookie: cookieStr });

        console.log(`   ${res.ok ? '✅' : '❌'} ${ep}: ${res.status}`);
      } catch {
        console.log(`   ❌ ${ep}: Erro`);
      }
    }

    console.log('\n✅ Exploração concluída!');

  } catch (err) {
    console.error('\n❌ Erro:', err.message);
  } finally {
    await browser.close();
  }
}

main();

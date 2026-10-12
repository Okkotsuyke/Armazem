#!/usr/bin/env node
/**
 * Exploração de datasets e widgets do Syonet
 */

import { chromium } from 'playwright';

const SYONET_URL = process.env.SYONET_URL || 'https://viasul.syonet.com';
const USERNAME = process.env.SYONET_USERNAME || 'camila.brito';
const PASSWORD = process.env.SYONET_PASSWORD || 'C@mila1234';

async function main() {
  console.log('\n🔵 Explorando Datasets e Widgets\n');

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

    // OBTER WIDGETS DO DASHBOARD
    console.log('2️⃣ Widgets do Dashboard 189...\n');

    const widgets = await page.evaluate(async (args) => {
      const res = await fetch(args.baseUrl + '/api/dashboard/189', {
        headers: { 'Cookie': args.cookie, 'Accept': 'application/json' },
      });
      const data = await res.json();

      const allWidgets = [];

      if (data.abas) {
        for (const aba of data.abas) {
          if (aba.widgets) {
            for (const widget of aba.widgets) {
              allWidgets.push({
                nome: widget.nome,
                idWidget: widget.idWidget,
                idDataset: widget.idDataset,
                tipoSaida: widget.tipoSaida,
                config: widget.config,
              });
            }
          }
        }
      }

      return allWidgets;
    }, { baseUrl: SYONET_URL, cookie: cookieStr });

    console.log(`   Total de widgets: ${widgets.length}\n`);

    widgets.forEach((w: any, i: number) => {
      console.log(`   [${i}] ${w.nome}`);
      console.log(`       Widget ID: ${w.idWidget}`);
      console.log(`       Dataset ID: ${w.idDataset}`);
      console.log(`       Tipo: ${w.tipoSaida}`);
      console.log('');
    });

    // TESTAR DATASET
    console.log('3️⃣ Testando Dataset 664...\n');

    const dataset664 = await page.evaluate(async (args) => {
      // Tentar diferentes formatos de endpoint
      const endpoints = [
        `/api/dataset/${args.id}`,
        `/api/dataset/${args.id}/execute`,
        `/api/dataset/execute/${args.id}`,
        `/api/query/${args.id}`,
        `/api/relatorio/${args.id}`,
      ];

      for (const ep of endpoints) {
        try {
          const res = await fetch(args.baseUrl + ep, {
            headers: { 'Cookie': args.cookie, 'Accept': 'application/json' },
          });

          if (res.ok) {
            const data = await res.json();
            return { endpoint: ep, status: res.status, data };
          }
        } catch {}
      }

      return { error: 'Nenhum endpoint funcionou' };
    }, { baseUrl: SYONET_URL, cookie: cookieStr, id: 664 });

    console.log(JSON.stringify(dataset664, null, 2)?.substring(0, 2000));

    // TESTAR SYONET MOBILE/API
    console.log('\n4️⃣ Testando API Mobile...\n');

    const mobileEndpoints = [
      '/mobile/api/dashboard',
      '/mobile/api/empresa',
      '/mobile/api/leads',
      '/api/v1/oportunidade',
      '/api/v2/dashboard',
    ];

    for (const ep of mobileEndpoints) {
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

    // TESTAR SYONET WORKFLOW/API
    console.log('\n5️⃣ Testando API Workflow...\n');

    const workflowEndpoints = [
      '/api/workflow/dashboard',
      '/api/workflow/oportunidade',
      '/workflow/api/dashboard',
      '/crm/api/dashboard',
      '/crm/api/oportunidade',
    ];

    for (const ep of workflowEndpoints) {
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

    // LISTAR MÍDIAS
    console.log('\n6️⃣ Lista de Mídias...\n');

    const midias = await page.evaluate(async (args) => {
      const res = await fetch(args.baseUrl + '/api/midia', {
        headers: { 'Cookie': args.cookie, 'Accept': 'application/json' },
      });
      const data = await res.json();
      return data.slice(0, 20).map((m: any) => ({
        id: m.id,
        nome: m.nome,
      }));
    }, { baseUrl: SYONET_URL, cookie: cookieStr });

    console.log(`   Total: ${midias.length}+ mídias`);
    midias.forEach((m: any) => {
      console.log(`   [${m.id}] ${m.nome}`);
    });

    console.log('\n✅ Exploração concluída!');

  } catch (err) {
    console.error('\n❌ Erro:', err.message);
  } finally {
    await browser.close();
  }
}

main();

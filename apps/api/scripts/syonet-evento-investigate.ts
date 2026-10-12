#!/usr/bin/env node
/**
 * Investigar API /api/evento com diferentes parâmetros
 */

import { chromium } from 'playwright';

const SYONET_URL = process.env.SYONET_URL || 'https://viasul.syonet.com';
const USERNAME = process.env.SYONET_USERNAME || 'camila.brito';
const PASSWORD = process.env.SYONET_PASSWORD || 'C@mila1234';

async function main() {
  console.log('\n🔵 Investigando API /api/evento\n');

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

    // TESTAR DIFERENTES PARÂMETROS PARA /api/evento
    console.log('2️⃣ Testando /api/evento com diferentes parâmetros...\n');

    const eventParams = [
      // Sem params
      { params: '', desc: 'Sem parâmetros' },
      // Com empresaId
      { params: '?empresaId=71', desc: 'Com empresaId=71' },
      { params: '?empresaId=71&tipoEvento=1', desc: 'Com tipoEvento' },
      { params: '?idEmpresa=71', desc: 'Com idEmpresa' },
      // Com data
      { params: '?dataInicio=2024-01-01', desc: 'Com dataInicio' },
      { params: '?dtInicio=2024-01-01', desc: 'Com dtInicio' },
      // Com page
      { params: '?page=0', desc: 'Com page=0' },
      { params: '?page=0&size=20', desc: 'Com page e size' },
      // Combinações
      { params: '?empresaId=71&page=0&size=10', desc: 'empresaId + page + size' },
      { params: '?idEmpresa=71&page=0&size=10', desc: 'idEmpresa + page + size' },
      // Com tipo
      { params: '?tipo=1', desc: 'Com tipo=1' },
      { params: '?tipoEvento=1', desc: 'Com tipoEvento=1' },
    ];

    for (const test of eventParams) {
      try {
        const res = await page.evaluate(async (args) => {
          const r = await fetch(args.baseUrl + '/api/evento' + args.params, {
            headers: {
              'Cookie': args.cookie,
              'Accept': 'application/json',
              'X-Requested-With': 'XMLHttpRequest',
            },
          });

          const text = await r.text();
          let data;
          try {
            data = JSON.parse(text);
          } catch {
            data = text.substring(0, 200);
          }

          return { status: r.status, ok: r.ok, type: typeof data, preview: typeof data === 'object' ? JSON.stringify(data).substring(0, 150) : data };
        }, { baseUrl: SYONET_URL, cookie: cookieStr, params: test.params });

        const icon = res.ok ? '✅' : res.status === 412 ? '⚠️' : '❌';
        console.log(`   ${icon} ${test.desc}: ${res.status}`);
        if (res.status === 200 && res.preview) {
          console.log(`      ${res.preview}`);
        }
      } catch (err) {
        console.log(`   ❌ ${test.desc}: ${err.message}`);
      }
    }

    // TESTAR /api/evento SEM O HEADER X-Requested-With
    console.log('\n3️⃣ Testando sem X-Requested-With header...\n');

    const noHeader = await page.evaluate(async (args) => {
      const r = await fetch(args.baseUrl + '/api/evento?empresaId=71', {
        headers: {
          'Cookie': args.cookie,
          'Accept': 'application/json',
        },
      });
      return { status: r.status, ok: r.ok };
    }, { baseUrl: SYONET_URL, cookie: cookieStr });

    console.log(`   Sem X-Requested-With: ${noHeader.status}`);

    // TESTAR API DE USUÁRIOS
    console.log('\n4️⃣ Testando API de Usuários...\n');

    const userEndpoints = [
      '/api/usuario',
      '/api/usuario/71',
      '/api/usuario/listar',
      '/api/vendedor',
      '/api/vendedor/listar',
      '/api/bdc',
      '/api/bdc/listar',
    ];

    for (const ep of userEndpoints) {
      try {
        const res = await page.evaluate(async (args) => {
          const r = await fetch(args.baseUrl + args.ep, {
            headers: { 'Cookie': args.cookie, 'Accept': 'application/json' },
          });

          const text = await r.text();
          let data;
          try {
            data = JSON.parse(text);
          } catch {
            data = text.substring(0, 100);
          }

          return { status: r.status, ok: r.ok, preview: typeof data === 'object' ? JSON.stringify(data).substring(0, 100) : data };
        }, { baseUrl: SYONET_URL, ep, cookie: cookieStr });

        const icon = res.ok ? '✅' : '❌';
        console.log(`   ${icon} ${ep}: ${res.status} ${res.preview}`);
      } catch {
        console.log(`   ❌ ${ep}: Erro`);
      }
    }

    // TESTAR API DE PRODUTIVIDADE (Dashboard 162)
    console.log('\n5️⃣ Testando dados de produtividade (Dashboard 162)...\n');

    const prod162 = await page.evaluate(async (args) => {
      const res = await fetch(args.baseUrl + '/api/dashboard/162', {
        headers: { 'Cookie': args.cookie, 'Accept': 'application/json' },
      });

      const data = await res.json();

      // Retornar estrutura completa
      return {
        keys: Object.keys(data),
        empresasRaw: data.empresas,
        firstEmpresa: data.empresas?.[0],
      };
    }, { baseUrl: SYONET_URL, cookie: cookieStr });

    console.log('   Keys:', prod162.keys.join(', '));
    console.log('   Empresas (tipo):', typeof prod162.empresasRaw);
    console.log('   Primeira empresa:', JSON.stringify(prod162.firstEmpresa));

    console.log('\n✅ Investigação concluída!');

  } catch (err) {
    console.error('\n❌ Erro:', err.message);
  } finally {
    await browser.close();
  }
}

main();

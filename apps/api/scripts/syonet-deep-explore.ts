#!/usr/bin/env node
/**
 * Exploração profunda da estrutura de dados do Syonet
 */

import { chromium } from 'playwright';

const SYONET_URL = process.env.SYONET_URL || 'https://viasul.syonet.com';
const USERNAME = process.env.SYONET_USERNAME || 'camila.brito';
const PASSWORD = process.env.SYONET_PASSWORD || 'C@mila1234';

async function main() {
  console.log('\n🔵 Exploração Profunda - Syonet\n');

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

    // OBTER DASHBOARD 189 COMPLETO COM JSON.stringify
    console.log('2️⃣ Dashboard 189 - Dados brutos...\n');

    const raw189 = await page.evaluate(async (args) => {
      const res = await fetch(args.baseUrl + '/api/dashboard/189', {
        headers: { 'Cookie': args.cookie, 'Accept': 'application/json' },
      });
      const text = await res.text();
      return text;
    }, { baseUrl: SYONET_URL, cookie: cookieStr });

    // Analisar JSON manualmente
    const data189 = JSON.parse(raw189);
    console.log('   Tipo de empresas:', typeof data189.empresas, Array.isArray(data189.empresas) ? '(array)' : '');
    console.log('   Tamanho de empresas:', data189.empresas?.length);
    console.log('   Primeiro elemento:', JSON.stringify(data189.empresas?.[0]));

    // Verificar se empresas é um array de números
    if (Array.isArray(data189.empresas) && data189.empresas.length > 0) {
      console.log('\n   Analisando primeira empresa:');
      const firstEmp = data189.empresas[0];
      console.log('   Tipo:', typeof firstEmp);

      if (typeof firstEmp === 'number') {
        console.log('   → Empresas é um array de IDs numéricos!');
        console.log('   → Precisamos buscar os dados das empresas separadamente');
      } else if (typeof firstEmp === 'object') {
        console.log('   → Empresas é um array de objetos');
        console.log('   → Keys:', Object.keys(firstEmp).join(', '));
        console.log('   → Dados:', JSON.stringify(firstEmp).substring(0, 500));
      }
    }

    // VERIFICAR AS ABAS DO DASHBOARD
    console.log('\n\n3️⃣ Abas do Dashboard...\n');
    console.log('   Abas:', JSON.stringify(data189.abas, null, 2)?.substring(0, 2000));

    // BUSCAR DADOS DE UMA EMPRESA ESPECÍFICA
    console.log('\n\n4️⃣ Dados da empresa VIASUL PIEDADE (71)...\n');

    const empresa71 = await page.evaluate(async (args) => {
      const res = await fetch(args.baseUrl + '/api/empresa/71', {
        headers: { 'Cookie': args.cookie, 'Accept': 'application/json' },
      });
      return res.json();
    }, { baseUrl: SYONET_URL, cookie: cookieStr });

    console.log(JSON.stringify(empresa71, null, 2)?.substring(0, 3000));

    // TENTAR BUSCAR EVENTOS/OPORTUNIDADES DA EMPRESA
    console.log('\n\n5️⃣ Tentando buscar eventos da empresa 71...\n');

    const eventos189 = await page.evaluate(async (args) => {
      // Tentar diferentes endpoints
      const endpoints = [
        `/api/evento/empresa/71`,
        `/api/evento/empresa/${args.empresaId}/page/0/size/20`,
        `/api/oportunidade/empresa/${args.empresaId}`,
        `/api/venda/empresa/${args.empresaId}`,
        `/api/tarefa/empresa/${args.empresaId}`,
      ];

      const results = [];
      for (const ep of endpoints) {
        try {
          const res = await fetch(args.baseUrl + ep, {
            headers: { 'Cookie': args.cookie, 'Accept': 'application/json' },
          });
          results.push({ endpoint: ep, status: res.status });
        } catch (err) {
          results.push({ endpoint: ep, error: err.message });
        }
      }
      return results;
    }, { baseUrl: SYONET_URL, cookie: cookieStr, empresaId: 71 });

    console.log('   Resultados:');
    eventos189.forEach((r: any) => {
      if (r.error) {
        console.log(`   ❌ ${r.endpoint}: ${r.error}`);
      } else {
        console.log(`   ${r.status < 400 ? '✅' : '❌'} ${r.endpoint}: ${r.status}`);
      }
    });

    // TENTAR ENDPOINTS QUE O SYONET USA NA UI
    console.log('\n\n6️⃣ Explorando outros endpoints...\n');

    const otherEndpoints = [
      '/api/midia',
      '/api/tipolead',
      '/api/situacao',
      '/api/eventolead',
      '/api/usuario/empresa/71',
      '/api/eventolead/empresa/71',
      '/api/leadempresa/71',
      '/api/vendaveiculo/empresa/71',
    ];

    for (const ep of otherEndpoints) {
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

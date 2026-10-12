/**
 * Script para ver a estrutura COMPLETA do Dashboard 189
 * As credenciais são lidas de variáveis de ambiente
 */

import { chromium } from 'playwright';
import * as fs from 'fs';

// Carregar variáveis de ambiente
const SYONET_URL = process.env.SYONET_URL || 'https://viasul.syonet.com';
const USERNAME = process.env.SYONET_USERNAME || '';
const PASSWORD = process.env.SYONET_PASSWORD || '';

async function main() {
  if (!USERNAME || !PASSWORD) {
    console.error('Configure SYONET_USERNAME e SYONET_PASSWORD no .env');
    process.exit(1);
  }

  console.log('\n🔵 Syonet Dashboard Full Structure\n');

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

    const cookies = await context.cookies();
    const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    // Buscar Dashboard 189 completo
    console.log('\n2️⃣ Buscando Dashboard 189 completo...');

    const dashboard189 = await page.evaluate(async (args) => {
      const res = await fetch(args.baseUrl + '/api/dashboard/189', {
        headers: {
          'Cookie': args.cookie,
          'Accept': 'application/json',
        },
      });

      const data = await res.json();

      // Analisar estrutura
      const structure = {
        topLevel: Object.keys(data),
        empresasType: Array.isArray(data.empresas) ? 'array' : typeof data.empresas,
        empresasLength: Array.isArray(data.empresas) ? data.empresas.length : null,
        abas: data.abas ? Object.keys(data.abas) : null,
        filtros: data.filtros ? Object.keys(data.filtros) : null,
      };

      // Primeira empresa detalhes
      let firstEmpDetails = null;
      if (data.empresas && data.empresas.length > 0) {
        firstEmpDetails = data.empresas[0];
      }

      return {
        status: res.status,
        structure,
        firstEmpresa: firstEmpDetails,
        full: data,
      };
    }, { baseUrl: SYONET_URL, cookie: cookieStr });

    console.log('   Estrutura:');
    console.log(JSON.stringify(dashboard189.structure, null, 2));

    console.log('\n   Primeira empresa:');
    if (dashboard189.firstEmpresa) {
      console.log(JSON.stringify(dashboard189.firstEmpresa, null, 2).substring(0, 3000));
    }

    // Salvar dados completos
    fs.writeFileSync('dashboard-189.json', JSON.stringify(dashboard189.full, null, 2));
    console.log('\n💾 Dashboard 189 salvo em dashboard-189.json');

    // Verificar abas
    console.log('\n3️⃣ Verificando abas do dashboard...');
    if (dashboard189.full.abas) {
      console.log(JSON.stringify(dashboard189.full.abas, null, 2).substring(0, 3000));
    }

    // Buscar lista de dashboards
    console.log('\n4️⃣ Listando todos os dashboards...');

    const dashboards = await page.evaluate(async (args) => {
      const res = await fetch(args.baseUrl + '/api/dashboard', {
        headers: {
          'Cookie': args.cookie,
          'Accept': 'application/json',
        },
      });

      const data = await res.json();
      return data.map((d: any) => ({
        id: d.idDashboard || d.id,
        nome: d.nome,
        keys: Object.keys(d).filter(k => !['idDashboard', 'nome'].includes(k)),
      }));
    }, { baseUrl: SYONET_URL, cookie: cookieStr });

    dashboards.slice(0, 10).forEach((d: any) => {
      console.log(`   [${d.id}] ${d.nome}`);
    });

    // Buscar empresa VIASUL completa
    console.log('\n5️⃣ Buscando empresa VIASUL (71) completa...');

    const viasulFull = await page.evaluate(async (args) => {
      const res = await fetch(args.baseUrl + '/api/empresa/71', {
        headers: {
          'Cookie': args.cookie,
          'Accept': 'application/json',
        },
      });
      const data = await res.json();
      return data;
    }, { baseUrl: SYONET_URL, cookie: cookieStr });

    console.log(JSON.stringify(viasulFull, null, 2).substring(0, 4000));

    // Tentar diferentes endpoints de leads
    console.log('\n6️⃣ Testando endpoints de leads...');

    const endpoints = [
      '/api/empresa/71/leads',
      '/api/empresa/71/oportunidade',
      '/api/empresa/71/evento',
      '/api/empresa/71/funil',
      '/api/eventos',
      '/api/oportunidades',
    ];

    for (const ep of endpoints) {
      try {
        const res = await page.evaluate(async (args) => {
          const r = await fetch(args.baseUrl + args.ep, {
            headers: {
              'Cookie': args.cookie,
              'Accept': 'application/json',
            },
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

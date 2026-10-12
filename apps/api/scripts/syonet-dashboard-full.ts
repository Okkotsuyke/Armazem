/**
 * Script para ver a estrutura COMPLETA do Dashboard 189
 */

import { chromium } from 'playwright';
import * as fs from 'fs';

const SYONET_URL = 'https://viasul.syonet.com';
const USERNAME = 'camila.brito';
const PASSWORD = 'C@mila1234';

async function main() {
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

    // Verificar URLs internas
    console.log('\n4️⃣ Verificando URLs internas...');
    if (dashboard189.full._url) {
      console.log(`   _url: ${dashboard189.full._url}`);
    }

    // Buscar lista de dashboards
    console.log('\n5️⃣ Listando todos os dashboards...');

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

    // Buscar dashboard específico da VIASUL (71)
    console.log('\n6️⃣ Buscando dashboard da VIASUL (empresa 71)...');

    const viasulDashboard = await page.evaluate(async (args) => {
      // Tentar buscar dashboard específico da empresa
      const endpoints = [
        `/api/dashboard/189?empresaId=71`,
        `/api/dashboard/189&empresaId=71`,
        `/api/dashboard/empresa/71`,
        `/api/empresa/71/dashboard`,
      ];

      for (const ep of endpoints) {
        try {
          const res = await fetch(args.baseUrl + ep, {
            headers: {
              'Cookie': args.cookie,
              'Accept': 'application/json',
            },
          });

          if (res.ok) {
            const data = await res.json();
            return { endpoint: ep, status: res.status, data };
          }
        } catch {}
      }

      return { error: 'Nenhum endpoint funcionou' };
    }, { baseUrl: SYONET_URL, cookie: cookieStr });

    console.log(JSON.stringify(viasulDashboard, null, 2).substring(0, 2000));

    // Tentar buscar dados via empresa específica
    console.log('\n7️⃣ Tentando buscar dados de leads via empresa...');

    const empresaData = await page.evaluate(async (args) => {
      // Tentar diferentes endpoints
      const endpoints = [
        `/api/empresa/71/leads`,
        `/api/empresa/71/oportunidade`,
        `/api/empresa/71/evento`,
        `/api/empresa/71/dashboard`,
        `/api/empresa/71/funil`,
      ];

      const results = [];
      for (const ep of endpoints) {
        try {
          const res = await fetch(args.baseUrl + ep, {
            headers: {
              'Cookie': args.cookie,
              'Accept': 'application/json',
            },
          });

          results.push({
            endpoint: ep,
            status: res.status,
            ok: res.ok,
          });
        } catch (err) {
          results.push({ endpoint: ep, error: err.message });
        }
      }

      return results;
    }, { baseUrl: SYONET_URL, cookie: cookieStr });

    empresaData.forEach((r: any) => {
      if (r.error) {
        console.log(`   ❌ ${r.endpoint}: ${r.error}`);
      } else {
        console.log(`   ${r.ok ? '✅' : '❌'} ${r.endpoint}: ${r.status}`);
      }
    });

    console.log('\n✅ Exploração concluída!');

  } catch (err) {
    console.error('\n❌ Erro:', err.message);
  } finally {
    await browser.close();
  }
}

main();

/**
 * Script para explorar dados do Dashboard 189 do Syonet
 */

import { chromium } from 'playwright';

const SYONET_URL = 'https://viasul.syonet.com';
const USERNAME = 'camila.brito';
const PASSWORD = 'C@mila1234';

async function main() {
  console.log('\n🔵 Syonet Dashboard 189 Explorer\n');

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

    // Explorar Dashboard 189
    console.log('\n2️⃣ Explorando Dashboard 189...\n');

    const dashboard189 = await page.evaluate(async (args) => {
      const res = await fetch(args.baseUrl + '/api/dashboard/189', {
        headers: {
          'Cookie': args.cookie,
          'Accept': 'application/json',
        },
      });

      const data = await res.json();
      return data;
    }, { baseUrl: SYONET_URL, cookie: cookieStr });

    console.log('   Estrutura:');
    console.log(`   - idDashboard: ${dashboard189.idDashboard}`);
    console.log(`   - nome: ${dashboard189.nome}`);
    console.log(`   - empresas: ${dashboard189.empresas?.length || 0} empresas`);
    console.log(`   - Keys: ${Object.keys(dashboard189).join(', ')}`);

    if (dashboard189.empresas) {
      console.log('\n   Empresas:');
      dashboard189.empresas.slice(0, 5).forEach((emp: any, i: number) => {
        console.log(`   [${i}] ${emp.nome || emp.apelido || emp.id} - Keys: ${Object.keys(emp).join(', ')}`);
      });
    }

    // Explorar primeira empresa em detalhes
    if (dashboard189.empresas && dashboard189.empresas.length > 0) {
      const firstEmp = dashboard189.empresas[0];
      console.log(`\n3️⃣ Detalhes da primeira empresa (${firstEmp.nome || firstEmp.id}):\n`);
      console.log(JSON.stringify(firstEmp, null, 2).substring(0, 2000));
    }

    // Explorar Dashboard 162 (Produtividade)
    console.log('\n4️⃣ Explorando Dashboard 162 (Produtividade)...\n');

    const dashboard162 = await page.evaluate(async (args) => {
      const res = await fetch(args.baseUrl + '/api/dashboard/162', {
        headers: {
          'Cookie': args.cookie,
          'Accept': 'application/json',
        },
      });

      const data = await res.json();
      return data;
    }, { baseUrl: SYONET_URL, cookie: cookieStr });

    console.log('   Estrutura:');
    console.log(`   - idDashboard: ${dashboard162.idDashboard}`);
    console.log(`   - nome: ${dashboard162.nome}`);
    console.log(`   - Keys: ${Object.keys(dashboard162).join(', ')}`);

    if (dashboard162.empresas) {
      console.log(`   - Empresas: ${dashboard162.empresas.length}`);
      if (dashboard162.empresas.length > 0) {
        console.log('\n   Primeira empresa:');
        console.log(JSON.stringify(dashboard162.empresas[0], null, 2).substring(0, 1500));
      }
    }

    // Testar empresa específica com mais dados
    console.log('\n5️⃣ Buscando empresa VIASUL (id=71)...\n');

    const viasulEmpresa = await page.evaluate(async (args) => {
      const res = await fetch(args.baseUrl + '/api/empresa/71', {
        headers: {
          'Cookie': args.cookie,
          'Accept': 'application/json',
        },
      });
      return { status: res.status, data: res.status === 200 ? await res.json() : null };
    }, { baseUrl: SYONET_URL, cookie: cookieStr });

    console.log(`   Status: ${viasulEmpresa.status}`);
    if (viasulEmpresa.data) {
      console.log(`   Keys: ${Object.keys(viasulEmpresa.data).join(', ')}`);
      console.log(JSON.stringify(viasulEmpresa.data, null, 2).substring(0, 2000));
    }

    // Testar /api/funil com parâmetros
    console.log('\n6️⃣ Testando /api/funil com parâmetros...\n');

    const funilParams = [
      '?empresaId=71',
      '?empresaId=71&dataInicio=2024-01-01&dataFim=2024-12-31',
      '?dataInicio=2024-01-01',
    ];

    for (const params of funilParams) {
      const funil = await page.evaluate(async (args) => {
        const res = await fetch(args.baseUrl + '/api/funil' + args.params, {
          headers: {
            'Cookie': args.cookie,
            'Accept': 'application/json',
          },
        });
        return { status: res.status, data: res.status === 200 ? await res.json() : await res.text() };
      }, { baseUrl: SYONET_URL, cookie: cookieStr, params });

      console.log(`   /api/funil${params}: ${funil.status}`);
      if (funil.status === 200) {
        const dataStr = typeof funil.data === 'object' ? JSON.stringify(funil.data).substring(0, 300) : funil.data;
        console.log(`      ${dataStr}`);
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

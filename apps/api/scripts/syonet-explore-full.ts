#!/usr/bin/env node
/**
 * Exploração completa dos dados do Syonet
 */

import { chromium } from 'playwright';

const SYONET_URL = process.env.SYONET_URL || 'https://viasul.syonet.com';
const USERNAME = process.env.SYONET_USERNAME || 'camila.brito';
const PASSWORD = process.env.SYONET_PASSWORD || 'C@mila1234';

async function main() {
  console.log('\n🔵 Exploração Completa dos Dados Syonet\n');

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

    // EXPLORAR DASHBOARD 189 COMPLETO
    console.log('2️⃣ Dashboard 189 - Estrutura completa...\n');

    const dashboard189 = await page.evaluate(async (args) => {
      const res = await fetch(args.baseUrl + '/api/dashboard/189', {
        headers: { 'Cookie': args.cookie, 'Accept': 'application/json' },
      });
      const data = await res.json();

      return {
        keys: Object.keys(data),
        empresasKeys: data.empresas?.length > 0 ? Object.keys(data.empresas[0]) : [],
        empresasSample: data.empresas?.slice(0, 2),
        abas: data.abas ? Object.keys(data.abas) : [],
        filtros: data.filtros,
      };
    }, { baseUrl: SYONET_URL, cookie: cookieStr });

    console.log('   Keys do dashboard:', dashboard189.keys.join(', '));
    console.log('   Keys das empresas:', dashboard189.empresasKeys.join(', '));
    console.log('   Abas:', dashboard189.abas.join(', '));

    console.log('\n   Empresas (amostra):');
    dashboard189.empresasSample?.forEach((emp: any, i: number) => {
      console.log(`\n   [${i}]`, JSON.stringify(emp, null, 2));
    });

    // EXPLORAR DASHBOARD 162 (PRODUTIVIDADE)
    console.log('\n\n3️⃣ Dashboard 162 - Produtividade...\n');

    const dashboard162 = await page.evaluate(async (args) => {
      const res = await fetch(args.baseUrl + '/api/dashboard/162', {
        headers: { 'Cookie': args.cookie, 'Accept': 'application/json' },
      });
      const data = await res.json();

      const firstEmpresa = data.empresas?.[0];
      const firstUser = firstEmpresa?.usuarios?.[0];

      return {
        keys: Object.keys(data),
        empresaKeys: firstEmpresa ? Object.keys(firstEmpresa) : [],
        usuarioKeys: firstUser ? Object.keys(firstUser) : [],
        empresasSample: data.empresas?.slice(0, 1),
        usuariosSample: firstEmpresa?.usuarios?.slice(0, 2),
      };
    }, { baseUrl: SYONET_URL, cookie: cookieStr });

    console.log('   Keys do dashboard:', dashboard162.keys.join(', '));
    console.log('   Keys da empresa:', dashboard162.empresaKeys.join(', '));
    console.log('   Keys do usuário:', dashboard162.usuarioKeys.join(', '));

    console.log('\n   Primeira empresa:');
    console.log(JSON.stringify(dashboard162.empresasSample?.[0], null, 2)?.substring(0, 2000));

    console.log('\n   Primeiro usuário:');
    console.log(JSON.stringify(dashboard162.usuariosSample?.[0], null, 2));

    // EXPLORAR DASHBOARD 244 (FUNIL)
    console.log('\n\n4️⃣ Dashboard 244 - Funil...\n');

    const dashboard244 = await page.evaluate(async (args) => {
      const res = await fetch(args.baseUrl + '/api/dashboard/244', {
        headers: { 'Cookie': args.cookie, 'Accept': 'application/json' },
      });
      const data = await res.json();

      return {
        keys: Object.keys(data),
        empresasSample: data.empresas?.slice(0, 1),
      };
    }, { baseUrl: SYONET_URL, cookie: cookieStr });

    console.log('   Keys do dashboard:', dashboard244.keys.join(', '));
    console.log('\n   Primeira empresa:');
    console.log(JSON.stringify(dashboard244.empresasSample?.[0], null, 2)?.substring(0, 3000));

    // LISTAR TODAS AS EMPRESAS
    console.log('\n\n5️⃣ Lista de Empresas...\n');

    const empresas = await page.evaluate(async (args) => {
      const res = await fetch(args.baseUrl + '/api/empresa', {
        headers: { 'Cookie': args.cookie, 'Accept': 'application/json' },
      });
      const data = await res.json();

      return data.filter((e: any) => e.ativo).map((e: any) => ({
        id: e.idEmpresa,
        nome: e.nome,
        apelido: e.apelido,
        marca: e.marcaBandeira,
        dominio: e.idDominio,
      }));
    }, { baseUrl: SYONET_URL, cookie: cookieStr });

    console.log(`   Total de empresas ativas: ${empresas.length}\n`);

    empresas.slice(0, 15).forEach((emp: any) => {
      console.log(`   [${emp.id}] ${emp.apelido} (${emp.marca})`);
    });

    console.log('\n✅ Exploração concluída!');

  } catch (err) {
    console.error('\n❌ Erro:', err.message);
  } finally {
    await browser.close();
  }
}

main();

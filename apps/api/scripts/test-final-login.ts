#!/usr/bin/env node
/**
 * Script de teste final para verificar login e extração de dados do Syonet
 *
 * Uso: cd apps/api && npx tsx scripts/test-final-login.ts
 */

import { chromium } from 'playwright';

// Credenciais (você pode hardcodar aqui para testar)
const SYONET_URL = process.env.SYONET_URL || 'https://viasul.syonet.com';
const USERNAME = process.env.SYONET_USERNAME || 'camila.brito';
const PASSWORD = process.env.SYONET_PASSWORD || 'C@mila1234';

const REACT_WAIT_TIME = 18000;

async function waitForInputs(page: any, maxAttempts = 60): Promise<number> {
  let inputCount = 0;
  let attempts = 0;

  while (inputCount === 0 && attempts < maxAttempts) {
    await page.waitForTimeout(500);
    inputCount = await page.evaluate(() => document.querySelectorAll('input').length);
    attempts++;
  }

  return inputCount;
}

async function main() {
  console.log('\n========================================');
  console.log('🧪 TESTE FINAL - SYONET REAL CLIENT');
  console.log('========================================\n');

  console.log(`URL: ${SYONET_URL}`);
  console.log(`User: ${USERNAME}\n`);

  const browser = await chromium.launch({
    headless: false,
  });

  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
  });

  const page = await context.newPage();

  try {
    // 1. LOGIN
    console.log('1️⃣ Fazendo login...\n');

    await page.goto(SYONET_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    console.log(`⏳ Aguardando React renderizar (${REACT_WAIT_TIME / 1000}s)...`);
    await page.waitForTimeout(REACT_WAIT_TIME);

    const inputCount = await waitForInputs(page);
    console.log(`✅ Inputs encontrados: ${inputCount}\n`);

    const inputs = await page.$$('input');
    await inputs[0].fill(USERNAME);
    await inputs[1].fill(PASSWORD);
    console.log('📝 Credenciais preenchidas\n');

    const enterBtn = await page.$('button:has-text("Entrar")');
    if (enterBtn) {
      await enterBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }
    console.log('🔘 Botão clicado\n');

    await page.waitForTimeout(10000);

    const finalUrl = page.url();
    const loginSuccess = !finalUrl.includes('login');

    if (loginSuccess) {
      console.log('✅✅✅ LOGIN BEM-SUCEDIDO! ✅✅✅\n');
    } else {
      console.log('❌ LOGIN FALHOU\n');
      await browser.close();
      process.exit(1);
    }

    // 2. TESTAR APIs
    console.log('2️⃣ Testando APIs...\n');

    const cookies = await context.cookies();
    const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    const endpoints = [
      { path: '/api/dashboard', name: 'Lista de Dashboards' },
      { path: '/api/dashboard/189', name: 'Dashboard Vendas' },
      { path: '/api/dashboard/162', name: 'Dashboard Produtividade' },
      { path: '/api/empresa', name: 'Lista de Empresas' },
      { path: '/api/empresa/71', name: 'Empresa VIASUL 71' },
      { path: '/api/empresa/91', name: 'Empresa BYD 91' },
      { path: '/api/funil', name: 'Funil' },
    ];

    for (const ep of endpoints) {
      try {
        const response = await page.evaluate(async (args) => {
          const res = await fetch(args.baseUrl + args.path, {
            headers: {
              'Cookie': args.cookie,
              'Accept': 'application/json',
            },
          });
          return { status: res.status, ok: res.ok };
        }, { baseUrl: SYONET_URL, path: ep.path, cookie: cookieStr });

        const icon = response.ok ? '✅' : '❌';
        console.log(`   ${icon} ${ep.name} (${ep.path}): ${response.status}`);
      } catch (err) {
        console.log(`   ❌ ${ep.name}: Erro`);
      }
    }

    // 3. EXTRAIR DADOS DE EXEMPLO
    console.log('\n3️⃣ Extraindo dados de exemplo...\n');

    const dashboardData = await page.evaluate(async (args) => {
      const res = await fetch(args.baseUrl + '/api/dashboard/189', {
        headers: {
          'Cookie': args.cookie,
          'Accept': 'application/json',
        },
      });

      if (!res.ok) return null;

      const data = await res.json();
      return {
        id: data.idDashboard,
        nome: data.nome,
        empresaCount: data.empresas?.length || 0,
        empresas: data.empresas?.slice(0, 3).map((e: any) => ({
          id: e.id,
          nome: e.nome || e.apelido,
        })),
      };
    }, { baseUrl: SYONET_URL, cookie: cookieStr });

    if (dashboardData) {
      console.log(`   Dashboard: ${dashboardData.id}`);
      console.log(`   Nome: ${dashboardData.nome}`);
      console.log(`   Empresas: ${dashboardData.empresaCount}`);
      if (dashboardData.empresas) {
        dashboardData.empresas.forEach((e: any) => {
          console.log(`      - ${e.id}: ${e.nome}`);
        });
      }
    }

    // 4. EXTRAIR EMPRESA VIASUL
    console.log('\n4️⃣ Detalhes da empresa VIASUL...\n');

    const viasulData = await page.evaluate(async (args) => {
      const res = await fetch(args.baseUrl + '/api/empresa/71', {
        headers: {
          'Cookie': args.cookie,
          'Accept': 'application/json',
        },
      });

      if (!res.ok) return null;

      const data = await res.json();
      return {
        id: data.idEmpresa,
        nome: data.nome,
        apelido: data.apelido,
        marca: data.marcaBandeira,
        ativo: data.ativo,
      };
    }, { baseUrl: SYONET_URL, cookie: cookieStr });

    if (viasulData) {
      console.log(`   ID: ${viasulData.id}`);
      console.log(`   Nome: ${viasulData.nome}`);
      console.log(`   Apelido: ${viasulData.apelido}`);
      console.log(`   Marca: ${viasulData.marca}`);
      console.log(`   Ativo: ${viasulData.ativo ? 'Sim' : 'Não'}`);
    }

    console.log('\n========================================');
    console.log('✅ TESTE CONCLUÍDO COM SUCESSO!');
    console.log('========================================\n');

  } catch (err) {
    console.error('\n❌ ERRO:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();

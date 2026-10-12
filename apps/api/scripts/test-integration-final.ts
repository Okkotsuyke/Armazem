#!/usr/bin/env node
/**
 * Teste Final da Integração Syonet
 * Verifica login, extração de empresas, eventos e mídias
 */

import { chromium } from 'playwright';
import * as fs from 'fs';

const SYONET_URL = process.env.SYONET_URL || 'https://viasul.syonet.com';
const USERNAME = process.env.SYONET_USERNAME || 'camila.brito';
const PASSWORD = process.env.SYONET_PASSWORD || 'C@mila1234';

const RESULTS: {
  login: boolean;
  empresas: number;
  eventos: number;
  midias: number;
  errors: string[];
} = {
  login: false,
  empresas: 0,
  eventos: 0,
  midias: 0,
  errors: [],
};

async function main() {
  console.log('\n========================================');
  console.log('🧪 TESTE FINAL - INTEGRAÇÃO SYONET');
  console.log('========================================\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. LOGIN
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

    RESULTS.login = !page.url().includes('login');
    console.log(`   Resultado: ${RESULTS.login ? '✅ OK' : '❌ FALHOU'}`);
    if (!RESULTS.login) {
      RESULTS.errors.push('Login falhou');
    }

    // 2. EXTRAIR EMPRESAS
    console.log('\n2️⃣ Extraindo Empresas...');
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
      }));
    }, { baseUrl: SYONET_URL, cookie: cookieStr });

    RESULTS.empresas = empresas.length;
    console.log(`   Resultado: ✅ ${empresas.length} empresas`);

    // Mostrar empresas principais
    const principais = empresas.filter((e: any) =>
      e.nome?.toLowerCase().includes('viasul') ||
      e.nome?.toLowerCase().includes('eurovia') ||
      e.nome?.toLowerCase().includes('byd')
    );
    principais.slice(0, 10).forEach((e: any) => {
      console.log(`      - ${e.apelido} (${e.marca})`);
    });

    // 3. EXTRAIR EVENTOS (VIASUL PIEDADE - ID 71)
    console.log('\n3️⃣ Extraindo Eventos (Empresa 71)...');
    const eventos = await page.evaluate(async (args) => {
      const res = await fetch(args.baseUrl + '/api/evento?idEmpresa=71&page=0&size=100', {
        headers: { 'Cookie': args.cookie, 'Accept': 'application/json' },
      });
      return res.ok ? await res.json() : [];
    }, { baseUrl: SYONET_URL, cookie: cookieStr });

    RESULTS.eventos = eventos.length;
    console.log(`   Resultado: ✅ ${eventos.length} eventos`);

    if (eventos.length > 0) {
      console.log('\n   Amostra de eventos:');
      eventos.slice(0, 3).forEach((e: any) => {
        console.log(`      - ${e.nomeCliente}: ${e.idTipoEvento} (${e.idSituacaoEvento})`);
      });

      // Salvar eventos
      fs.writeFileSync('test-eventos.json', JSON.stringify(eventos, null, 2));
    }

    // 4. EXTRAIR MÍDIAS
    console.log('\n4️⃣ Extraindo Mídias...');
    const midias = await page.evaluate(async (args) => {
      const res = await fetch(args.baseUrl + '/api/midia', {
        headers: { 'Cookie': args.cookie, 'Accept': 'application/json' },
      });
      const data = await res.json();
      return data.map((m: any) => ({
        id: m.idMidia,
        label: m.label,
        tipo: m.tipoMidia,
      }));
    }, { baseUrl: SYONET_URL, cookie: cookieStr });

    RESULTS.midias = midias.length;
    console.log(`   Resultado: ✅ ${midias.length} mídias`);

    midias.slice(0, 5).forEach((m: any) => {
      console.log(`      - ${m.label} (${m.tipo})`);
    });

    // 5. TESTAR DASHBOARDS
    console.log('\n5️⃣ Testando Dashboards...');
    const dashboards = [
      { id: 189, nome: 'Vendas' },
      { id: 162, nome: 'Produtividade' },
      { id: 244, nome: 'Funil' },
    ];

    for (const db of dashboards) {
      const res = await page.evaluate(async (args) => {
        const r = await fetch(args.baseUrl + `/api/dashboard/${args.id}`, {
          headers: { 'Cookie': args.cookie, 'Accept': 'application/json' },
        });
        return r.ok;
      }, { baseUrl: SYONET_URL, cookie: cookieStr, id: db.id });

      console.log(`   Dashboard ${db.id} (${db.nome}): ${res ? '✅ OK' : '❌ ERRO'}`);
    }

    // RESUMO FINAL
    console.log('\n========================================');
    console.log('📊 RESUMO DO TESTE');
    console.log('========================================');
    console.log(`   Login: ${RESULTS.login ? '✅ OK' : '❌ FALHOU'}`);
    console.log(`   Empresas: ${RESULTS.empresas > 0 ? '✅' : '❌'} ${RESULTS.empresas} empresas`);
    console.log(`   Eventos: ${RESULTS.eventos > 0 ? '✅' : '❌'} ${RESULTS.eventos} eventos`);
    console.log(`   Mídias: ${RESULTS.midias > 0 ? '✅' : '❌'} ${RESULTS.midias} mídias`);

    if (RESULTS.errors.length > 0) {
      console.log('\n   Erros:');
      RESULTS.errors.forEach((e) => console.log(`      - ${e}`));
    }

    const sucesso = RESULTS.login && RESULTS.empresas > 0 && RESULTS.eventos > 0;
    console.log(`\n   Status: ${sucesso ? '✅ SUCESSO' : '❌ FALHA'}`);
    console.log('========================================\n');

    if (sucesso) {
      console.log('💾 Arquivos gerados:');
      console.log('   - test-eventos.json');
      console.log('\n✅ INTEGRAÇÃO SYONET FUNCIONANDO!\n');
    }

  } catch (err) {
    RESULTS.errors.push(err.message);
    console.error('\n❌ ERRO:', err.message);
  } finally {
    await browser.close();
  }
}

main();

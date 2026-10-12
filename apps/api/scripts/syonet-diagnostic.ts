/**
 * Script de diagnóstico profundo para Syonet
 * Verifica se JavaScript está executando corretamente
 */

import { chromium } from 'playwright';
import * as fs from 'fs';

const SYONET_URL = 'https://viasul.syonet.com';

async function main() {
  console.log('\n🔵 Syonet Deep Diagnostic\n');

  const browser = await chromium.launch({
    headless: false,
  });

  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
  });

  const page = await context.newPage();

  // Capturar TUDO
  const allLogs: string[] = [];
  const allErrors: string[] = [];
  const allNetwork: { url: string; status: number; type: string }[] = [];

  page.on('console', msg => {
    allLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', err => {
    allErrors.push(err.message);
  });

  page.on('request', req => {
    if (req.url().includes('.js')) {
      allNetwork.push({
        url: req.url(),
        status: 0,
        type: 'js',
      });
    }
  });

  page.on('response', res => {
    if (res.url().includes('.js')) {
      const entry = allNetwork.find(n => n.url === res.url());
      if (entry) entry.status = res.status();
    }
  });

  try {
    console.log('1️⃣ Navegando...');
    const response = await page.goto(SYONET_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    console.log(`   Status HTTP: ${response?.status()}`);

    // Aguardar um pouco
    await page.waitForTimeout(3000);

    console.log('\n2️⃣ Console Logs:');
    allLogs.slice(0, 20).forEach(log => console.log(`   ${log}`));

    console.log('\n3️⃣ Page Errors:');
    allErrors.forEach(err => console.log(`   ❌ ${err}`));

    console.log('\n4️⃣ Scripts JS carregados:');
    allNetwork.forEach(n => {
      console.log(`   ${n.status} ${n.url.split('/').pop()}`);
    });

    console.log('\n5️⃣ Verificando JavaScript global:');
    const jsState = await page.evaluate(() => {
      return {
        hasReact: typeof (window as any).React !== 'undefined',
        hasWebpackJsonp: typeof (window as any).webpackJsonp !== 'undefined',
        hasModule: typeof (window as any).module !== 'undefined',
        hasRequire: typeof (window as any).require !== 'undefined',
        reactVersion: (window as any).React?.version,
        rootInnerHTML: document.getElementById('root')?.innerHTML?.substring(0, 500),
        documentReadyState: document.readyState,
      };
    });

    console.log(`   React: ${jsState.hasReact} (v${jsState.reactVersion || '?'})`);
    console.log(`   Webpack: ${jsState.hasWebpackJsonp}`);
    console.log(`   Document readyState: ${jsState.documentReadyState}`);
    console.log(`   Root HTML: ${jsState.rootInnerHTML?.substring(0, 200) || '(vazio)'}`);

    console.log('\n6️⃣ Forçando timeout de 15s para carregar JS...');
    await page.waitForTimeout(15000);

    const afterWait = await page.evaluate(() => {
      return {
        inputCount: document.querySelectorAll('input').length,
        rootChildren: document.getElementById('root')?.children.length,
        rootHTML: document.getElementById('root')?.innerHTML?.substring(0, 1000),
      };
    });

    console.log(`   Inputs: ${afterWait.inputCount}`);
    console.log(`   Root children: ${afterWait.rootChildren}`);

    if (afterWait.rootHTML) {
      console.log('\n   📄 Root HTML (1000 chars):');
      console.log(afterWait.rootHTML);
    }

    // Salvar tudo para debug
    await page.screenshot({ path: 'diagnostic.png', fullPage: true });
    fs.writeFileSync('diagnostic-report.txt', `
=== SYONET DIAGNOSTIC REPORT ===
Generated: ${new Date().toISOString()}

CONSOLE LOGS:
${allLogs.join('\n')}

PAGE ERRORS:
${allErrors.join('\n')}

JS FILES LOADED:
${allNetwork.map(n => `${n.status} ${n.url}`).join('\n')}

JAVA SCRIPT STATE:
${JSON.stringify(jsState, null, 2)}

AFTER 15s WAIT:
${JSON.stringify(afterWait, null, 2)}
    `);

    console.log('\n📄 Relatório salvo em diagnostic-report.txt');
    console.log('📸 Screenshot salvo em diagnostic.png');

  } catch (err) {
    console.error('\n❌ Erro:', err.message);
  } finally {
    await browser.close();
  }
}

main();

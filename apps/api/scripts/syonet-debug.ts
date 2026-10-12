/**
 * Script de debug para Syonet
 * Analisa erros de JavaScript e tenta diferentes abordagens
 */

import { chromium } from 'playwright';
import * as fs from 'fs';

const SYONET_URL = 'https://viasul.syonet.com';
const USERNAME = 'camila.brito';
const PASSWORD = 'C@mila1234';

async function main() {
  console.log('\n🔵 Syonet Debug Script\n');

  const browser = await chromium.launch({
    headless: false,
  });

  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  // Capturar erros de console
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Capturar erros de página
  const pageErrors: string[] = [];
  page.on('pageerror', err => {
    pageErrors.push(err.message);
  });

  // Capturar respostas de rede
  const networkResponses: { url: string; status: number; contentType: string }[] = [];
  page.on('response', response => {
    const ct = response.headers()['content-type'] || '';
    if (ct.includes('javascript') || ct.includes('json')) {
      networkResponses.push({
        url: response.url(),
        status: response.status(),
        contentType: ct,
      });
    }
  });

  try {
    console.log('1️⃣ Navegando...');
    await page.goto(SYONET_URL, {
      waitUntil: 'load',
      timeout: 60000,
    });

    // Aguardar 5 segundos
    console.log('2️⃣ Aguardando 5s para carregamento inicial...');
    await page.waitForTimeout(5000);

    // Verificar erros
    console.log('\n📊 Console Errors:');
    if (consoleErrors.length === 0) {
      console.log('   Nenhum erro de console');
    } else {
      consoleErrors.forEach(e => console.log(`   ❌ ${e}`));
    }

    console.log('\n📊 Page Errors:');
    if (pageErrors.length === 0) {
      console.log('   Nenhum erro de página');
    } else {
      pageErrors.forEach(e => console.log(`   ❌ ${e}`));
    }

    console.log('\n📊 Respostas de Rede (JS/JSON):');
    networkResponses.slice(0, 10).forEach(r => {
      console.log(`   ${r.status} ${r.url.substring(0, 80)}`);
    });

    // Analisar DOM via evaluate
    console.log('\n3️⃣ Analisando DOM via JavaScript...');
    const domAnalysis = await page.evaluate(() => {
      return {
        inputCount: document.querySelectorAll('input').length,
        buttonCount: document.querySelectorAll('button').length,
        divCount: document.querySelectorAll('div').length,
        hasReact: !!(window as any).React || document.querySelector('[data-reactroot]'),
        reactRoot: !!document.getElementById('root'),
        rootContent: document.getElementById('root')?.innerHTML?.substring(0, 500),
        bodyClasses: document.body.className,
        documentMode: (document as any).documentMode,
      };
    });

    console.log(`   Inputs: ${domAnalysis.inputCount}`);
    console.log(`   Buttons: ${domAnalysis.buttonCount}`);
    console.log(`   Divs: ${domAnalysis.divCount}`);
    console.log(`   React Root: ${domAnalysis.reactRoot}`);
    console.log(`   Body Classes: ${domAnalysis.bodyClasses || 'nenhuma'}`);

    if (domAnalysis.rootContent) {
      console.log('\n   📄 Conteúdo do #root (500 chars):');
      console.log('   ' + domAnalysis.rootContent.replace(/\n/g, ' ').substring(0, 200));
    }

    // Tentar executar JavaScript diretamente
    console.log('\n4️⃣ Tentando JavaScript direto...');

    // Forçar等待 mais tempo
    console.log('   Aguardando mais 10s...');
    await page.waitForTimeout(10000);

    const domAfter = await page.evaluate(() => {
      return {
        inputCount: document.querySelectorAll('input').length,
        buttonCount: document.querySelectorAll('button').length,
        rootContent: document.getElementById('root')?.innerHTML?.substring(0, 1000),
      };
    });

    console.log(`   Inputs agora: ${domAfter.inputCount}`);
    console.log(`   Buttons agora: ${domAfter.buttonCount}`);

    if (domAfter.rootContent) {
      console.log('\n   📄 Conteúdo do #root (1000 chars):');
      console.log('   ' + domAfter.rootContent.substring(0, 500));
    }

    // Salvar screenshots
    await page.screenshot({ path: 'debug-1.png', fullPage: true });
    console.log('\n   📸 Screenshot salvo em debug-1.png');

    // Salvar HTML
    const fullHtml = await page.content();
    fs.writeFileSync('debug-page.html', fullHtml);
    console.log('   💾 HTML completo salvo em debug-page.html');

    // Tentar login se inputs apareceram
    if (domAfter.inputCount > 0) {
      console.log('\n5️⃣ Tentando login...');
      const inputs = await page.$$('input');
      await inputs[0].fill(USERNAME);
      await inputs[1].fill(PASSWORD);

      const submitBtn = await page.$('button');
      if (submitBtn) await submitBtn.click();
      else await page.keyboard.press('Enter');

      await page.waitForTimeout(5000);
      console.log(`   URL final: ${page.url()}`);
    }

    console.log('\n✅ Debug concluído');

  } catch (err) {
    console.error('\n❌ Erro:', err.message);
  } finally {
    await browser.close();
  }
}

main();

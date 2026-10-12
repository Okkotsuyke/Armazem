/**
 * Script que usa a MESMA abordagem que funcionou no diagnóstico
 */

import { chromium } from 'playwright';

const SYONET_URL = 'https://viasul.syonet.com';
const USERNAME = 'camila.brito';
const PASSWORD = 'C@mila1234';

async function main() {
  console.log('\n🔵 Syonet Login - Identical to Diagnostic\n');

  const browser = await chromium.launch({
    headless: false,
  });

  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
  });

  const page = await context.newPage();

  try {
    console.log('1️⃣ Navegando...');
    // MESMA ABORDAGEM DO DIAGNÓSTICO QUE FUNCIONOU
    await page.goto(SYONET_URL, {
      waitUntil: 'domcontentloaded', // Isso funcionou
      timeout: 60000,
    });

    // MESMO TEMPO DE ESPERA DO DIAGNÓSTICO
    console.log('2️⃣ Aguardando 3s...');
    await page.waitForTimeout(3000);

    // VERIFICAR ESTADO INTERMEDIÁRIO (como no diagnóstico)
    console.log('3️⃣ Verificação intermediária...');
    const check1 = await page.evaluate(() => document.querySelectorAll('input').length);
    console.log(`   Inputs: ${check1}`);

    // ESPERAR 15s (como no diagnóstico)
    console.log('4️⃣ Aguardando mais 15s (exatamente como diagnóstico)...');
    await page.waitForTimeout(15000);

    // VERIFICAR COM A MESMA ABORDAGEM DO DIAGNÓSTICO
    const state = await page.evaluate(() => {
      return {
        inputCount: document.querySelectorAll('input').length,
        rootChildren: document.getElementById('root')?.children.length,
        rootHTML: document.getElementById('root')?.innerHTML?.substring(0, 500),
      };
    });

    console.log(`   Inputs: ${state.inputCount}`);
    console.log(`   Root children: ${state.rootChildren}`);
    console.log(`   Root HTML: ${state.rootHTML?.substring(0, 200)}...`);

    if (state.inputCount > 0) {
      console.log('\n5️⃣ Inputs encontrados! Prosseguindo...');

      // Preencher
      await page.evaluate((creds: { user: string; pass: string }) => {
        const inputs = Array.from(document.querySelectorAll('input'));
        const userInput = inputs.find((el: HTMLInputElement) => el.type !== 'password');
        const passInput = inputs.find((el: HTMLInputElement) => el.type === 'password');

        if (userInput) {
          userInput.value = creds.user;
          userInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (passInput) {
          passInput.value = creds.pass;
          passInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, { user: USERNAME, pass: PASSWORD });

      // Aguardar e clicar
      console.log('6️⃣ Clicando em Entrar...');
      await page.waitForTimeout(500);

      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const enterBtn = buttons.find((btn: HTMLButtonElement) =>
          btn.textContent?.toLowerCase().includes('entrar')
        );
        if (enterBtn) enterBtn.click();
      });

      // Aguardar
      console.log('7️⃣ Aguardando redirecionamento...');
      await page.waitForTimeout(10000);

      const finalUrl = page.url();
      console.log(`   URL: ${finalUrl}`);

      if (!finalUrl.includes('login')) {
        console.log('\n✅ LOGIN BEM-SUCEDIDO!');
      } else {
        console.log('\n❌ LOGIN FALHOU');
      }

    } else {
      console.log('\n❌ Inputs nunca apareceram (como no diagnóstico?)');

      // Tentar com a URL correta de login
      console.log('\n8️⃣ Tentando URL de login diretamente...');
      await page.goto(`${SYONET_URL}/portal/app.do?modulo=login`, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      console.log('   Aguardando 20s...');
      await page.waitForTimeout(20000);

      const afterDirect = await page.evaluate(() => document.querySelectorAll('input').length);
      console.log(`   Inputs: ${afterDirect}`);
    }

    await page.screenshot({ path: 'result.png', fullPage: true });

  } catch (err) {
    console.error('\n❌ Erro:', err.message);
  } finally {
    await browser.close();
  }
}

main();

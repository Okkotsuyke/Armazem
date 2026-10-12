/**
 * Script definitivo de login Syonet
 * Usa polling para aguardar React renderizar completamente
 */

import { chromium } from 'playwright';

const SYONET_URL = 'https://viasul.syonet.com';
const USERNAME = 'camila.brito';
const PASSWORD = 'C@mila1234';

async function waitForReact(page: any, maxWait = 30000) {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    const state = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      return {
        inputCount: inputs.length,
        hasMuiAppBar: !!document.querySelector('.MuiAppBar-root'),
        rootHasContent: document.getElementById('root')?.children.length > 0,
      };
    });

    if (state.inputCount > 0) {
      return state;
    }

    await page.waitForTimeout(500);
  }

  return null;
}

async function main() {
  console.log('\n🔵 Syonet Login Final\n');

  const browser = await chromium.launch({
    headless: false,
  });

  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
  });

  const page = await context.newPage();

  try {
    console.log('1️⃣ Navegando para login...');
    await page.goto(`${SYONET_URL}/portal/app.do?modulo=login`, {
      waitUntil: 'load',
      timeout: 60000,
    });

    console.log('2️⃣ Aguardando React renderizar completamente...');
    const state = await waitForReact(page, 30000);

    if (!state) {
      console.log('   ⚠️ Timeout esperando React');
    } else {
      console.log(`   ✅ React renderizado! Inputs: ${state.inputCount}`);
    }

    // Verificação intermediária
    console.log('\n3️⃣ Verificação intermediária...');
    const check1 = await page.evaluate(() => document.querySelectorAll('input').length);
    console.log(`   Inputs via evaluate: ${check1}`);

    const check2 = await page.$$('input');
    console.log(`   Inputs via $$: ${check2.length}`);

    // Verificar screenshot intermediário
    await page.screenshot({ path: 'check-1.png' });

    // Tentar abordagem diferente: MutationObserver
    console.log('\n4️⃣ Tentando MutationObserver...');

    const mutationResult = await page.evaluate(() => {
      return new Promise((resolve) => {
        const root = document.getElementById('root');
        if (!root) {
          resolve({ success: false, reason: 'No root element' });
          return;
        }

        // Observar mudanças no DOM
        const observer = new MutationObserver((mutations) => {
          const inputs = document.querySelectorAll('input');
          if (inputs.length > 0) {
            observer.disconnect();
            resolve({
              success: true,
              inputCount: inputs.length,
              mutations: mutations.length,
            });
          }
        });

        observer.observe(root, { childList: true, subtree: true });

        // Timeout de 10 segundos
        setTimeout(() => {
          observer.disconnect();
          resolve({
            success: false,
            reason: 'timeout',
            inputCount: document.querySelectorAll('input').length,
          });
        }, 10000);
      });
    });

    console.log(`   MutationObserver: ${JSON.stringify(mutationResult)}`);

    // Verificar novamente após MutationObserver
    const finalCheck = await page.evaluate(() => document.querySelectorAll('input').length);
    console.log(`\n5️⃣ Inputs agora: ${finalCheck}`);

    if (finalCheck > 0) {
      console.log('\n6️⃣ Preenchendo login...');
      await page.evaluate((creds: { user: string; pass: string }) => {
        const inputs = document.querySelectorAll('input');
        const userInput = Array.from(inputs).find((el: HTMLInputElement) => el.type !== 'password');
        const passInput = Array.from(inputs).find((el: HTMLInputElement) => el.type === 'password');

        if (userInput) {
          (userInput as HTMLInputElement).value = creds.user;
          userInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (passInput) {
          (passInput as HTMLInputElement).value = creds.pass;
          passInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, { user: USERNAME, pass: PASSWORD });

      console.log('\n7️⃣ Clicando em Entrar...');
      await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        const enterBtn = Array.from(buttons).find((btn: HTMLButtonElement) =>
          btn.textContent?.toLowerCase().includes('entrar') ||
          btn.textContent?.toLowerCase().includes('login')
        );
        if (enterBtn) {
          (enterBtn as HTMLButtonElement).click();
        }
      });

      console.log('8️⃣ Aguardando redirecionamento...');
      await page.waitForTimeout(10000);

      const finalUrl = page.url();
      console.log(`   URL: ${finalUrl}`);

      if (!finalUrl.includes('login')) {
        console.log('\n✅ LOGIN BEM-SUCEDIDO!');
      } else {
        console.log('\n❌ LOGIN FALHOU');
      }
    } else {
      console.log('\n❌ Inputs nunca apareceram');

      // Verificar o que há na página
      const pageContent = await page.evaluate(() => {
        const root = document.getElementById('root');
        return {
          rootExists: !!root,
          rootChildren: root?.children.length,
          rootHTML: root?.innerHTML.substring(0, 2000),
          bodyHTML: document.body.innerHTML.substring(0, 1000),
        };
      });

      console.log('\n📄 Análise da página:');
      console.log(`   Root existe: ${pageContent.rootExists}`);
      console.log(`   Root children: ${pageContent.rootChildren}`);

      if (pageContent.rootHTML) {
        console.log('\n   📄 Root HTML (2000 chars):');
        console.log(pageContent.rootHTML);
      }
    }

    await page.screenshot({ path: 'final.png', fullPage: true });

  } catch (err) {
    console.error('\n❌ Erro:', err.message);
  } finally {
    await browser.close();
  }
}

main();

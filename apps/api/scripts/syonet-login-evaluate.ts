/**
 * Script de login Syonet usando evaluate (JavaScript no navegador)
 * Funciona porque o DOM tem inputs mas o Playwright não os detecta via selectors
 */

import { chromium } from 'playwright';
import * as fs from 'fs';

const SYONET_URL = 'https://viasul.syonet.com';
const USERNAME = 'camila.brito';
const PASSWORD = 'C@mila1234';

async function main() {
  console.log('\n🔵 Syonet Login Script (Evaluate Mode)\n');

  const browser = await chromium.launch({
    headless: false,
  });

  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  // Capturar erros
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  try {
    // 1. Navegar para login
    console.log('1️⃣ Navegando para login...');
    await page.goto(`${SYONET_URL}/portal/app.do?modulo=login`, {
      waitUntil: 'load',
      timeout: 60000,
    });

    // Aguardar React renderizar
    console.log('2️⃣ Aguardando React renderizar (10s)...');
    await page.waitForTimeout(10000);

    // 2. Verificar DOM via evaluate
    console.log('3️⃣ Verificando DOM...');
    const initialState = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      const buttons = document.querySelectorAll('button');
      return {
        inputCount: inputs.length,
        buttonCount: buttons.length,
        inputDetails: Array.from(inputs).map((el: HTMLInputElement) => ({
          type: el.type,
          name: el.name,
          id: el.id,
          placeholder: el.placeholder,
          autocomplete: el.autocomplete,
          value: el.value,
        })),
        buttonDetails: Array.from(buttons).map((el: HTMLButtonElement) => ({
          type: el.type,
          text: el.textContent?.trim(),
          disabled: el.disabled,
        })),
      };
    });

    console.log(`   Inputs: ${initialState.inputCount}`);
    console.log(`   Buttons: ${initialState.buttonCount}`);
    console.log('\n   Detalhes dos Inputs:');
    initialState.inputDetails.forEach((inp, i) => {
      console.log(`   [${i}] type=${inp.type}, name=${inp.name}, id=${inp.id}, placeholder=${inp.placeholder}`);
    });
    console.log('\n   Detalhes dos Buttons:');
    initialState.buttonDetails.forEach((btn, i) => {
      console.log(`   [${i}] "${btn.text}", disabled=${btn.disabled}`);
    });

    // 3. Preencher via JavaScript no navegador
    console.log('\n4️⃣ Preenchendo credenciais via JavaScript...');

    const fillResult = await page.evaluate((creds: { user: string; pass: string }) => {
      const inputs = document.querySelectorAll('input');
      const results: string[] = [];

      // Encontrar inputs de usuário e senha
      let userInput: HTMLInputElement | null = null;
      let passInput: HTMLInputElement | null = null;

      inputs.forEach((el: HTMLInputElement) => {
        if (el.type === 'text' || el.type === 'email' || (!el.type)) {
          if (!userInput) userInput = el;
        }
        if (el.type === 'password') {
          if (!passInput) passInput = el;
        }
      });

      if (userInput) {
        userInput.value = creds.user;
        userInput.dispatchEvent(new Event('input', { bubbles: true }));
        userInput.dispatchEvent(new Event('change', { bubbles: true }));
        results.push(`User filled: ${userInput.outerHTML.substring(0, 100)}`);
      }

      if (passInput) {
        passInput.value = creds.pass;
        passInput.dispatchEvent(new Event('input', { bubbles: true }));
        passInput.dispatchEvent(new Event('change', { bubbles: true }));
        results.push(`Pass filled: ${passInput.outerHTML.substring(0, 100)}`);
      }

      return {
        userFilled: !!userInput,
        passFilled: !!passInput,
        details: results,
        inputCount: inputs.length,
      };
    }, { user: USERNAME, pass: PASSWORD });

    console.log(`   User preenchido: ${fillResult.userFilled}`);
    console.log(`   Pass preenchido: ${fillResult.passFilled}`);

    // Verificar valores
    console.log('\n5️⃣ Verificando valores preenchidos...');
    const values = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      return Array.from(inputs).map((el: HTMLInputElement) => ({
        type: el.type,
        value: el.value,
        placeholder: el.placeholder,
      }));
    });
    values.forEach((v, i) => {
      console.log(`   [${i}] type=${v.type}, value="${v.value.substring(0, 10)}${v.value.length > 10 ? '...' : ''}", placeholder=${v.placeholder}`);
    });

    // 6. Clicar no botão de login
    console.log('\n6️⃣ Clicando em Entrar...');

    const clickResult = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      let clicked = false;

      // Primeiro, tentar encontrar botão com texto "Entrar"
      buttons.forEach((btn: HTMLButtonElement) => {
        const text = btn.textContent?.toLowerCase() || '';
        if (text.includes('entrar') || text.includes('login') || text.includes('acessar')) {
          if (!btn.disabled) {
            btn.click();
            clicked = true;
          }
        }
      });

      // Se não encontrou, clicar no primeiro botão não desabilitado
      if (!clicked) {
        buttons.forEach((btn: HTMLButtonElement) => {
          if (!btn.disabled && !clicked) {
            btn.click();
            clicked = true;
          }
        });
      }

      return {
        clicked,
        buttonCount: buttons.length,
        buttons: Array.from(buttons).map((b: HTMLButtonElement) => ({
          text: b.textContent?.trim(),
          disabled: b.disabled,
        })),
      };
    });

    console.log(`   Clicado: ${clickResult.clicked}`);
    console.log(`   Botões: ${clickResult.buttonCount}`);

    // 7. Aguardar resposta
    console.log('\n7️⃣ Aguardando resposta do servidor (10s)...');
    await page.waitForTimeout(10000);

    const finalUrl = page.url();
    console.log(`   URL atual: ${finalUrl}`);

    // 8. Verificar resultado
    console.log('\n8️⃣ Analisando resultado...');
    const isLoggedIn = !finalUrl.includes('login') || finalUrl.includes('acessaSistema');

    if (isLoggedIn) {
      console.log('\n✅ LOGIN BEM-SUCEDIDO!\n');

      // Salvar cookies
      const cookies = await context.cookies();
      console.log('   Cookies salvos:');
      cookies.forEach(c => {
        console.log(`   - ${c.name}: ${c.value.substring(0, 30)}...`);
      });

      // Testar APIs
      console.log('\n9️⃣ Testando APIs...');
      const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');

      const apiResults = await page.evaluate(async (args) => {
        const apis = [
          '/api/dashboard',
          '/api/dashboard/189',
          '/api/empresa',
          '/portal/api/dashboard',
          '/portal/api/v1/dashboard',
        ];

        const results = [];
        for (const api of apis) {
          try {
            const res = await fetch(args.baseUrl + api, {
              headers: {
                'Cookie': args.cookie,
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
              },
            });
            const text = await res.text();
            let data;
            try {
              data = JSON.parse(text);
            } catch {
              data = text.substring(0, 200);
            }
            results.push({ api, status: res.status, data });
          } catch (err) {
            results.push({ api, error: err.message });
          }
        }
        return results;
      }, { baseUrl: SYONET_URL, cookie: cookieStr });

      apiResults.forEach((r: any) => {
        if (r.error) {
          console.log(`   ${r.api}: ❌ ${r.error}`);
        } else {
          console.log(`   ${r.api}: ${r.status}`);
          if (r.status === 200 && typeof r.data === 'object') {
            console.log(`      Data keys: ${Object.keys(r.data).join(', ')}`);
          }
        }
      });

    } else {
      console.log('\n❌ LOGIN FALHOU');
    }

    // Screenshot final
    await page.screenshot({ path: 'final-result.png', fullPage: true });
    console.log('\n📸 Screenshot salvo em final-result.png');

  } catch (err) {
    console.error('\n❌ Erro:', err.message);
    await page.screenshot({ path: 'error.png', fullPage: true }).catch(() => {});
  } finally {
    console.log('\n🔒 Fechando navegador...');
    await browser.close();
  }
}

main();

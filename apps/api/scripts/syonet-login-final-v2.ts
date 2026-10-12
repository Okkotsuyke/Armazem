/**
 * Script FINAL de login Syonet
 * Usa polling robusto para aguardar React renderizar completamente
 */

import { chromium } from 'playwright';

const SYONET_URL = 'https://viasul.syonet.com';
const USERNAME = 'camila.brito';
const PASSWORD = 'C@mila1234';

async function main() {
  console.log('\n🔵 Syonet Login - FINAL\n');

  const browser = await chromium.launch({
    headless: false,
  });

  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
  });

  const page = await context.newPage();

  try {
    console.log('1️⃣ Navegando...');
    await page.goto(`${SYONET_URL}/portal/app.do?modulo=login`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    // AGUARDAR INPUTS COM POLLING ROBUSTO
    console.log('2️⃣ Aguardando inputs aparecerem (polling)...');

    let inputCount = 0;
    let attempts = 0;
    const maxAttempts = 60; // 60 * 500ms = 30 segundos

    while (inputCount === 0 && attempts < maxAttempts) {
      await page.waitForTimeout(500);
      inputCount = await page.evaluate(() => document.querySelectorAll('input').length);
      attempts++;

      if (attempts % 10 === 0) {
        console.log(`   Progresso: ${attempts}/${maxAttempts}, inputs: ${inputCount}`);
      }
    }

    if (inputCount === 0) {
      console.log('❌ Timeout esperando inputs');
      await page.screenshot({ path: 'timeout.png', fullPage: true });
      return;
    }

    console.log(`   ✅ Inputs encontrados após ${attempts * 500}ms`);

    // Obter detalhes dos inputs
    console.log('\n3️⃣ Analisando campos de login...');
    const inputDetails = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      return inputs.map((el: HTMLInputElement) => ({
        type: el.type,
        name: el.name,
        id: el.id,
        placeholder: el.placeholder,
        autocomplete: el.autocomplete,
      }));
    });

    inputDetails.forEach((inp, i) => {
      console.log(`   [${i}] type=${inp.type}, placeholder=${inp.placeholder}, name=${inp.name}`);
    });

    // Identificar campos de usuário e senha
    const userInput = inputDetails.findIndex(inp =>
      inp.type === 'text' || inp.type === 'email' || inp.type === 'login' ||
      inp.placeholder?.toLowerCase().includes('usuário') ||
      inp.placeholder?.toLowerCase().includes('login') ||
      inp.placeholder?.toLowerCase().includes('email')
    );

    const passInput = inputDetails.findIndex(inp => inp.type === 'password');

    console.log(`\n   Campo usuário: índice ${userInput}`);
    console.log(`   Campo senha: índice ${passInput}`);

    // Preencher credenciais usando evaluate
    console.log('\n4️⃣ Preenchendo credenciais...');

    await page.evaluate((creds: { user: string; pass: string }) => {
      const inputs = Array.from(document.querySelectorAll('input'));

      // Encontrar input de usuário (primeiro não-password ou com placeholder de usuário)
      const userEl = inputs.find((el: HTMLInputElement) =>
        (el.type !== 'password' && el.type !== 'checkbox' && el.type !== 'radio') ||
        el.placeholder?.toLowerCase().includes('usuário') ||
        el.placeholder?.toLowerCase().includes('login') ||
        el.placeholder?.toLowerCase().includes('email')
      ) as HTMLInputElement;

      // Encontrar input de senha
      const passEl = inputs.find((el: HTMLInputElement) => el.type === 'password') as HTMLInputElement;

      if (userEl) {
        userEl.value = creds.user;
        userEl.dispatchEvent(new Event('input', { bubbles: true }));
        userEl.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('User filled');
      }

      if (passEl) {
        passEl.value = creds.pass;
        passEl.dispatchEvent(new Event('input', { bubbles: true }));
        passEl.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('Pass filled');
      }
    }, { user: USERNAME, pass: PASSWORD });

    // Aguardar um momento
    await page.waitForTimeout(500);

    // Verificar valores preenchidos
    console.log('\n5️⃣ Verificando preenchimento...');
    const values = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      return inputs.map((el: HTMLInputElement) => ({
        type: el.type,
        value: el.value ? '(preenchido)' : '(vazio)',
      }));
    });
    values.forEach((v, i) => {
      console.log(`   [${i}] ${v.type}: ${v.value}`);
    });

    // Encontrar e clicar no botão de login
    console.log('\n6️⃣ Clicando em Entrar...');

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));

      // Primeiro tentar encontrar botão com texto específico
      const enterBtn = buttons.find((btn: HTMLButtonElement) =>
        btn.textContent?.toLowerCase().includes('entrar') ||
        btn.textContent?.toLowerCase().includes('login') ||
        btn.textContent?.toLowerCase().includes('acessar')
      );

      if (enterBtn && !enterBtn.disabled) {
        enterBtn.click();
        console.log('Enter button clicked');
      } else {
        // Clicar no primeiro botão não desabilitado
        const firstEnabled = buttons.find((btn: HTMLButtonElement) => !btn.disabled);
        if (firstEnabled) {
          firstEnabled.click();
          console.log('First enabled button clicked');
        } else {
          console.log('No enabled button found');
        }
      }
    });

    // Aguardar redirecionamento
    console.log('\n7️⃣ Aguardando redirecionamento...');
    await page.waitForTimeout(10000);

    const finalUrl = page.url();
    console.log(`   URL: ${finalUrl}`);

    // Verificar resultado
    const isLoggedIn = !finalUrl.includes('login') || finalUrl.includes('acessaSistema');

    if (isLoggedIn) {
      console.log('\n✅ LOGIN BEM-SUCEDIDO!\n');

      // Extrair dados da sessão
      const cookies = await context.cookies();
      console.log('   Sessão:');
      cookies.forEach(c => {
        console.log(`   - ${c.name}: ${c.value.substring(0, 40)}...`);
      });

      // Testar APIs
      console.log('\n8️⃣ Testando APIs...');
      const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');

      const apiTest = await page.evaluate(async (args) => {
        const apis = [
          '/api/dashboard',
          '/api/dashboard/189',
          '/api/empresa',
          '/portal/api/dashboard',
        ];

        const results = [];
        for (const api of apis) {
          try {
            const res = await fetch(args.baseUrl + api, {
              headers: {
                'Cookie': args.cookie,
                'Accept': 'application/json',
              },
            });
            results.push({ api, status: res.status, ok: res.ok });
          } catch (err) {
            results.push({ api, error: err.message });
          }
        }
        return results;
      }, { baseUrl: SYONET_URL, cookie: cookieStr });

      apiTest.forEach((r: any) => {
        if (r.error) {
          console.log(`   ${r.api}: ❌ ${r.error}`);
        } else {
          console.log(`   ${r.api}: ${r.status} ${r.ok ? '✅' : '❌'}`);
        }
      });

      // Salvar cookies para uso futuro
      const sessionData = {
        timestamp: new Date().toISOString(),
        url: finalUrl,
        cookies: cookies.map(c => ({ name: c.name, value: c.value })),
      };
      console.log('\n💾 Sessão pronta para sincronização');

    } else {
      console.log('\n❌ LOGIN FALHOU');
      await page.screenshot({ path: 'login-failed.png', fullPage: true });
    }

    await page.screenshot({ path: 'final.png', fullPage: true });
    console.log('\n📸 Screenshot salvo em final.png');

  } catch (err) {
    console.error('\n❌ Erro:', err.message);
    await page.screenshot({ path: 'error.png', fullPage: true }).catch(() => {});
  } finally {
    console.log('\n🔒 Fechando navegador...');
    await browser.close();
  }
}

main();

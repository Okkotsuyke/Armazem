/**
 * Script melhorado para testar conexão com Syonet
 * Aguarda elementos específicos do React aparecerem
 */

import { chromium } from 'playwright';

const SYONET_URL = 'https://viasul.syonet.com';
const USERNAME = 'camila.brito';
const PASSWORD = 'C@mila1234';

async function main() {
  console.log('\n🔵 Syonet Connection Test v3\n');
  console.log(`URL: ${SYONET_URL}`);
  console.log(`User: ${USERNAME}\n`);

  const browser = await chromium.launch({
    headless: false,
  });

  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  try {
    // 1. Ir para página de login
    console.log('1️⃣ Navegando para login...');
    await page.goto(`${SYONET_URL}/portal/app.do?modulo=login`, {
      waitUntil: 'load',
      timeout: 60000,
    });

    console.log('2️⃣ Aguardando inputs aparecerem no DOM...');

    // Aguardar até 30 segundos para inputs aparecerem
    try {
      await page.waitForFunction(
        () => document.querySelectorAll('input').length > 0,
        { timeout: 30000 }
      );
      console.log('   ✅ Inputs detectados no DOM!');
    } catch {
      console.log('   ⚠️ Timeout esperando inputs. Analisando DOM...');
    }

    // 3. Analisar DOM atual
    console.log('3️⃣ Analisando DOM...');
    const inputs = await page.$$('input');
    console.log(`   Inputs encontrados: ${inputs.length}`);

    // Listar todos os inputs
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const type = await input.getAttribute('type');
      const name = await input.getAttribute('name');
      const id = await input.getAttribute('id');
      const placeholder = await input.getAttribute('placeholder') || '';
      const isVisible = await input.isVisible();
      console.log(`   [${i}] type=${type}, name=${name}, id=${id}, placeholder=${placeholder}, visible=${isVisible}`);
    }

    // Listar outros elementos interativos
    console.log('\n   Outros elementos:');
    const buttons = await page.$$('button');
    console.log(`   Buttons: ${buttons.length}`);
    for (let i = 0; i < Math.min(buttons.length, 5); i++) {
      const text = await buttons[i].textContent();
      const type = await buttons[i].getAttribute('type');
      console.log(`   Button[${i}]: "${text?.trim()}", type=${type}`);
    }

    // 4. Verificar elementos MUI/React
    console.log('\n4️⃣ Verificando framework UI...');
    const muiTextField = await page.$('.MuiTextField-root, [class*="TextField"], [class*="textfield"]');
    console.log(`   MUI TextField: ${muiTextField ? 'Encontrado' : 'Não encontrado'}`);

    const paper = await page.$('.MuiPaper-root, [class*="paper"]');
    console.log(`   MUI Paper: ${paper ? 'Encontrado' : 'Não encontrado'}`);

    // 5. Fazer screenshot para debug
    await page.screenshot({ path: 'dom-analysis.png', fullPage: true });
    console.log('\n   📸 Screenshot salvo em dom-analysis.png');

    // 6. Tentar login
    console.log('\n5️⃣ Tentando preencher login...');

    // Estratégias progressivas
    let filled = false;

    // Estratégia 1: Inputs visíveis
    const visibleInputs = [];
    for (const input of inputs) {
      if (await input.isVisible()) {
        visibleInputs.push(input);
      }
    }

    if (visibleInputs.length >= 2) {
      console.log(`   Estratégia 1: ${visibleInputs.length} inputs visíveis`);
      await visibleInputs[0].fill(USERNAME);
      await visibleInputs[1].fill(PASSWORD);
      filled = true;
    }

    // Estratégia 2: Primeiro e segundo input
    if (!filled && inputs.length >= 2) {
      console.log('   Estratégia 2: Primeiros 2 inputs');
      await inputs[0].fill(USERNAME);
      await inputs[1].fill(PASSWORD);
      filled = true;
    }

    // Estratégia 3: Click e type diretamente
    if (!filled) {
      console.log('   Estratégia 3: Click e type no body');
      const body = await page.$('body');
      if (body) {
        // Clicar no primeiro input
        await page.click('input').catch(() => {});
        await page.type('input[type="text"], input:not([type="password"])', USERNAME).catch(() => {});
        await page.type('input[type="password"]', PASSWORD).catch(() => {});
        filled = true;
      }
    }

    if (filled) {
      console.log('   ✅ Credenciais preenchidas (aparentemente)');

      // Clicar em Entrar
      console.log('6️⃣ Clicando em Entrar...');
      await page.waitForTimeout(1000);

      // Tentar múltiplos seletores
      const enterSelectors = [
        'button[type="submit"]',
        'button:has-text("Entrar")',
        'button:has-text("entrar")',
        'button:has-text("Acessar")',
        'button:has-text("Login")',
        'button:has-text("LOGIN")',
        'input[type="submit"]',
        'button:first-of-type',
        'button',
      ];

      for (const selector of enterSelectors) {
        const btn = await page.$(selector);
        if (btn && await btn.isVisible()) {
          console.log(`   Clicando: ${selector}`);
          await btn.click();
          break;
        }
      }

      // Fallback: Enter no password
      await page.keyboard.press('Enter');

      // 7. Aguardar redirecionamento
      console.log('7️⃣ Aguardando redirecionamento (10s)...');
      await page.waitForTimeout(10000);

      const finalUrl = page.url();
      console.log(`   URL atual: ${finalUrl}`);

      if (finalUrl.includes('acessaSistema') || (!finalUrl.includes('login') && !finalUrl.includes('#/login'))) {
        console.log('\n✅ POSSÍVEL LOGIN BEM-SUCEDIDO!\n');

        // 8. Testar APIs
        console.log('8️⃣ Testando APIs internas...');
        const cookies = await context.cookies();
        const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');

        const apis = [
          '/api/dashboard',
          '/api/empresa',
          '/api/usuario',
          '/portal/api/dashboard',
        ];

        for (const api of apis) {
          try {
            const response = await page.evaluate(async (args) => {
              const res = await fetch(args.baseUrl + args.api, {
                headers: {
                  'Cookie': args.cookie,
                  'Accept': 'application/json',
                  'X-Requested-With': 'XMLHttpRequest',
                },
              });
              return { status: res.status };
            }, { baseUrl: SYONET_URL, api, cookie: cookieStr });

            console.log(`   ${api}: ${response.status}`);
          } catch (err) {
            console.log(`   ${api}: Erro`);
          }
        }

        console.log('\n🎉 Teste concluído!');

      } else {
        console.log('\n⚠️ LOGIN PODE TER FALHADO');
        await page.screenshot({ path: 'after-login.png', fullPage: true });
        console.log('Screenshot salvo em after-login.png');
      }
    } else {
      console.log('\n❌ NÃO FOI POSSÍVEL PREENCHER LOGIN');

      // Mostrar todo o HTML
      const html = await page.content();
      console.log('\n📄 HTML Completo (últimos 3000 chars):');
      console.log(html.slice(-3000));
    }

  } catch (err) {
    console.error('\n❌ Erro:', err.message);
    await page.screenshot({ path: 'error.png', fullPage: true }).catch(() => {});
  } finally {
    console.log('\n🔒 Fechando navegador...');
    await browser.close();
  }
}

main();

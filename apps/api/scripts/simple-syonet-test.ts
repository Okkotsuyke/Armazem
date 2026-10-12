/**
 * Script simples para testar conexão com Syonet
 * Execute: npx tsx apps/api/scripts/simple-syonet-test.ts
 */

import { chromium } from 'playwright';

const SYONET_URL = 'https://viasul.syonet.com';
const USERNAME = 'camila.brito';
const PASSWORD = 'C@mila1234';

async function main() {
  console.log('\n🔵 Syonet Connection Test\n');
  console.log(`URL: ${SYONET_URL}`);
  console.log(`User: ${USERNAME}\n`);

  const browser = await chromium.launch({
    headless: false, // Mostra o navegador para debug
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
      waitUntil: 'networkidle', // Aguarda toda a rede ficar idle
      timeout: 90000,
    });

    // Aguardar mais tempo para SPA inicializar
    console.log('2️⃣ Aguardando SPA inicializar (8s)...');
    await page.waitForTimeout(8000);

    // 3. Verificar o que carregou
    console.log('3️⃣ Analisando página carregada...');

    const html = await page.content();
    console.log(`   Tamanho do HTML: ${html.length} caracteres`);

    // 4. Procurar campos de login
    console.log('4️⃣ Procurando campos de login...');

    const inputs = await page.$$('input');
    console.log(`   Encontrados ${inputs.length} campos input`);

    // Tentar waitForSelector com timeout mais longo
    console.log('   Tentando encontrar campo de usuário...');
    try {
      const loginField = await page.waitForSelector('input', { timeout: 10000 });
      if (loginField) {
        const type = await loginField.getAttribute('type');
        console.log(`   ✅ Primeiro input encontrado: type=${type}`);
      }
    } catch {
      console.log('   ⚠️ Nenhum input encontrado após 10s');
    }

    for (const input of inputs.slice(0, 5)) {
      const type = await input.getAttribute('type');
      const name = await input.getAttribute('name');
      const id = await input.getAttribute('id');
      const placeholder = await input.getAttribute('placeholder') || '';
      console.log(`   Input: type=${type}, name=${name}, id=${id}, placeholder=${placeholder}`);
    }

    // 5. Tentar diferentes estratégias de login
    console.log('5️⃣ Tentando preencher login...');

    // Estratégia 1: Seletor por tipo
    let filled = false;
    const loginInput = await page.$('input[type="text"], input:not([type="password"]):not([type="checkbox"]):not([type="radio"])');
    const passwordInput = await page.$('input[type="password"]');

    if (loginInput && passwordInput) {
      console.log('   Estratégia 1: Inputs por tipo');
      await loginInput.fill(USERNAME);
      await passwordInput.fill(PASSWORD);
      filled = true;
    }

    // Estratégia 2: Placeholder
    if (!filled) {
      const userByPlaceholder = await page.$('input[placeholder*="us" i], input[placeholder*="login" i], input[placeholder*="e-mail" i], input[placeholder*="email" i]');
      const passByPlaceholder = await page.$('input[placeholder*="senha" i], input[placeholder*="password" i]');

      if (userByPlaceholder && passByPlaceholder) {
        console.log('   Estratégia 2: Inputs por placeholder');
        await userByPlaceholder.fill(USERNAME);
        await passByPlaceholder.fill(PASSWORD);
        filled = true;
      }
    }

    // Estratégia 3: Todos os inputs
    if (!filled && inputs.length >= 2) {
      console.log('   Estratégia 3: Primeiros 2 inputs');
      await inputs[0].fill(USERNAME);
      await inputs[1].fill(PASSWORD);
      filled = true;
    }

    if (filled) {
      console.log('   ✅ Credenciais preenchidas');

      // 6. Clicar em Entrar
      console.log('6️⃣ Clicando em Entrar...');
      await page.waitForTimeout(500);

      const submitBtn = await page.$('button[type="submit"], button:has-text("Entrar"), input[type="submit"], button');
      if (submitBtn) {
        await submitBtn.click();
      } else {
        await page.keyboard.press('Enter');
      }

      // 7. Aguardar redirecionamento
      console.log('7️⃣ Aguardando redirecionamento...');
      await page.waitForTimeout(8000);

      const finalUrl = page.url();
      console.log(`   URL atual: ${finalUrl}`);

      const loginSuccess = !finalUrl.includes('login') || finalUrl.includes('acessaSistema');

      if (loginSuccess) {
        console.log('\n✅ LOGIN BEM-SUCEDIDO!\n');

        // 8. Testar APIs internas
        console.log('8️⃣ Testando APIs internas...');

        const cookies = await context.cookies();
        const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');

        const apis = [
          '/api/dashboard',
          '/api/empresa',
          '/api/usuario',
          '/api/funil',
          '/api/v1/dashboard',
          '/api/v1/empresa',
        ];

        for (const api of apis) {
          try {
            const response = await page.evaluate(async (args) => {
              const res = await fetch(args.baseUrl + args.api, {
                headers: {
                  'Cookie': args.cookie,
                  'Accept': 'application/json',
                },
              });
              return { status: res.status, ok: res.ok };
            }, { baseUrl: SYONET_URL, api, cookie: cookieStr });

            console.log(`   ${api}: ${response.status} ${response.ok ? '✅' : '❌'}`);
          } catch (err) {
            console.log(`   ${api}: Erro ❌`);
          }
        }

        console.log('\n🎉 Teste concluído!');

      } else {
        console.log('\n❌ LOGIN FALHOU');
        await page.screenshot({ path: 'login-failed.png' });
        console.log('Screenshot salvo em login-failed.png');
      }
    } else {
      console.log('\n❌ Não foi possível encontrar campos de login');
      await page.screenshot({ path: 'login-page.png' });
      console.log('Screenshot salvo em login-page.png');

      // Mostrar mais HTML para debug
      console.log('\n📄 HTML da página (caracteres 2000-5000):');
      if (html.length > 2000) {
        console.log(html.substring(2000, 5000));
      }
    }

  } catch (err) {
    console.error('\n❌ Erro:', err.message);
    await page.screenshot({ path: 'error-screenshot.png' }).catch(() => {});
  } finally {
    await browser.close();
  }
}

main();

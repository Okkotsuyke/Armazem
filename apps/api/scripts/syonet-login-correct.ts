/**
 * Script de login Syonet - CORRIGIDO
 * USA page.fill() que é a forma correta para campos React controlados
 */

import { chromium } from 'playwright';

const SYONET_URL = 'https://viasul.syonet.com';
const USERNAME = 'camila.brito';
const PASSWORD = 'C@mila1234';

async function main() {
  console.log('\n🔵 Syonet Login - CORRIGIDO\n');

  const browser = await chromium.launch({
    headless: false,
  });

  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
  });

  const page = await context.newPage();

  try {
    console.log('1️⃣ Navegando...');
    await page.goto(SYONET_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    console.log('2️⃣ Aguardando React (18s)...');
    await page.waitForTimeout(18000);

    console.log('3️⃣ Verificando DOM...');
    const inputs = await page.$$('input');
    console.log(`   Inputs encontrados: ${inputs.length}`);

    for (let i = 0; i < inputs.length; i++) {
      const type = await inputs[i].getAttribute('type');
      console.log(`   [${i}] type=${type}`);
    }

    if (inputs.length >= 2) {
      // USAR page.fill() QUE SIMULA DIGITAÇÃO REAL
      console.log('\n4️⃣ Preenchendo usuário com page.fill()...');
      await inputs[0].fill(USERNAME);
      console.log('   ✅ Usuário preenchido');

      console.log('5️⃣ Preenchendo senha com page.fill()...');
      await inputs[1].fill(PASSWORD);
      console.log('   ✅ Senha preenchida');

      // Verificar valores
      console.log('\n6️⃣ Verificando valores...');
      const userValue = await inputs[0].inputValue();
      const passValue = await inputs[1].inputValue();
      console.log(`   Usuário: ${userValue ? 'preenchido' : 'VAZIO'}`);
      console.log(`   Senha: ${passValue ? 'preenchida' : 'VAZIA'}`);

      // Screenshot antes de clicar
      await page.screenshot({ path: 'before-click.png', fullPage: true });

      // Clicar no botão Entrar
      console.log('\n7️⃣ Clicando em Entrar...');
      const enterBtn = await page.$('button:has-text("Entrar")');

      if (enterBtn) {
        await enterBtn.click();
        console.log('   ✅ Botão clicado');
      } else {
        console.log('   ⚠️ Botão não encontrado, usando Enter...');
        await page.keyboard.press('Enter');
      }

      // Aguardar resposta
      console.log('\n8️⃣ Aguardando resposta (15s)...');
      await page.waitForTimeout(15000);

      const finalUrl = page.url();
      console.log(`   URL: ${finalUrl}`);

      if (!finalUrl.includes('login')) {
        console.log('\n✅✅✅ LOGIN BEM-SUCEDIDO! ✅✅✅\n');

        // Testar APIs
        console.log('9️⃣ Testando APIs...');
        const cookies = await context.cookies();
        const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');

        const apis = [
          '/api/dashboard',
          '/api/dashboard/189',
          '/api/empresa',
          '/portal/api/dashboard',
        ];

        for (const api of apis) {
          try {
            const response = await page.evaluate(async (args) => {
              const res = await fetch(args.baseUrl + api, {
                headers: {
                  'Cookie': args.cookie,
                  'Accept': 'application/json',
                },
              });
              return { status: res.status };
            }, { baseUrl: SYONET_URL, cookie: cookieStr });

            console.log(`   ${api}: ${response.status}`);
          } catch (err) {
            console.log(`   ${api}: Erro`);
          }
        }

      } else {
        console.log('\n❌ LOGIN FALHOU');

        // Verificar mensagens de erro
        const errorText = await page.evaluate(() => {
          const errorEl = document.querySelector('.Mui-error, [role="alert"], .error');
          return errorEl?.textContent?.trim() || 'Nenhuma mensagem de erro';
        });
        console.log(`   Erro: ${errorText}`);
      }

    } else {
      console.log('\n❌ Inputs não encontrados');
    }

    await page.screenshot({ path: 'final.png', fullPage: true });

  } catch (err) {
    console.error('\n❌ Erro:', err.message);
    await page.screenshot({ path: 'error.png', fullPage: true }).catch(() => {});
  } finally {
    await browser.close();
  }
}

main();

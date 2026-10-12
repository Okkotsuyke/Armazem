/**
 * Script de login Syonet com debug detalhado
 */

import { chromium } from 'playwright';

const SYONET_URL = 'https://viasul.syonet.com';
const USERNAME = 'camila.brito';
const PASSWORD = 'C@mila1234';

async function main() {
  console.log('\n🔵 Syonet Login - Detailed Debug\n');

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

    console.log('2️⃣ Aguardando React...');
    await page.waitForTimeout(18000); // 18 segundos

    console.log('3️⃣ Verificando DOM...');
    const initial = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const buttons = Array.from(document.querySelectorAll('button'));
      return {
        inputCount: inputs.length,
        buttonsCount: buttons.length,
        inputs: inputs.map((el: HTMLInputElement) => ({
          type: el.type,
          placeholder: el.placeholder,
          name: el.name,
          id: el.id,
          value: el.value,
          disabled: el.disabled,
        })),
        buttons: buttons.map((el: HTMLButtonElement) => ({
          text: el.textContent?.trim(),
          type: el.type,
          disabled: el.disabled,
        })),
      };
    });

    console.log(`   Inputs: ${initial.inputCount}`);
    console.log(`   Buttons: ${initial.buttonsCount}`);
    console.log('\n   Inputs:');
    initial.inputs.forEach((inp, i) => {
      console.log(`   [${i}] type=${inp.type}, placeholder=${inp.placeholder}, value="${inp.value}", disabled=${inp.disabled}`);
    });
    console.log('\n   Buttons:');
    initial.buttons.forEach((btn, i) => {
      console.log(`   [${i}] "${btn.text}", disabled=${btn.disabled}`);
    });

    // Preencher usando abordagem diferente
    console.log('\n4️⃣ Preenchendo usuário...');

    const userFilled = await page.evaluate((user: string) => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const userInput = inputs.find((el: HTMLInputElement) =>
        el.type === 'text' || el.type === 'email' || el.type === 'login' || (!el.type)
      );

      if (userInput) {
        userInput.focus();
        userInput.value = user;

        // Dispatch events that React listens to
        userInput.dispatchEvent(new Event('input', { bubbles: true }));
        userInput.dispatchEvent(new Event('change', { bubbles: true }));
        userInput.dispatchEvent(new FocusEvent('blur', { bubbles: true }));

        return { success: true, value: userInput.value };
      }
      return { success: false };
    }, USERNAME);

    console.log(`   Result: ${JSON.stringify(userFilled)}`);

    // Preencher senha
    console.log('5️⃣ Preenchendo senha...');

    const passFilled = await page.evaluate((pass: string) => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const passInput = inputs.find((el: HTMLInputElement) => el.type === 'password');

      if (passInput) {
        passInput.focus();
        passInput.value = pass;

        passInput.dispatchEvent(new Event('input', { bubbles: true }));
        passInput.dispatchEvent(new Event('change', { bubbles: true }));
        passInput.dispatchEvent(new FocusEvent('blur', { bubbles: true }));

        return { success: true, value: passInput.value };
      }
      return { success: false };
    }, PASSWORD);

    console.log(`   Result: ${JSON.stringify(passFilled)}`);

    // Verificar valores
    console.log('\n6️⃣ Verificando valores preenchidos...');

    const valuesCheck = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      return inputs.map((el: HTMLInputElement) => ({
        type: el.type,
        valueLength: el.value.length,
        value: el.value ? el.value.substring(0, 5) + '...' : '(empty)',
      }));
    });
    valuesCheck.forEach((v, i) => {
      console.log(`   [${i}] ${v.type}: ${v.value} (length: ${v.valueLength})`);
    });

    // Screenshot antes de clicar
    await page.screenshot({ path: 'before-click.png', fullPage: true });

    // Clicar botão
    console.log('\n7️⃣ Clicando em Entrar...');

    const clickResult = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));

      // Find enter button
      const enterBtn = buttons.find((btn: HTMLButtonElement) =>
        btn.textContent?.toLowerCase().includes('entrar')
      );

      if (enterBtn) {
        const beforeDisabled = enterBtn.disabled;
        enterBtn.click();
        return { clicked: true, beforeDisabled, text: enterBtn.textContent?.trim() };
      }

      // Try first non-disabled button
      const firstEnabled = buttons.find((btn: HTMLButtonElement) => !btn.disabled);
      if (firstEnabled) {
        firstEnabled.click();
        return { clicked: true, button: 'first-enabled', text: firstEnabled.textContent?.trim() };
      }

      return { clicked: false };
    });

    console.log(`   Click result: ${JSON.stringify(clickResult)}`);

    // Aguardar resposta
    console.log('\n8️⃣ Aguardando resposta (15s)...');
    await page.waitForTimeout(15000);

    const finalUrl = page.url();
    console.log(`   URL: ${finalUrl}`);

    if (!finalUrl.includes('login')) {
      console.log('\n✅ LOGIN BEM-SUCEDIDO!');
    } else {
      console.log('\n❌ LOGIN FALHOU');

      // Verificar se houve mensagens de erro
      const errorCheck = await page.evaluate(() => {
        const errorSelectors = [
          '.Mui-error',
          '[role="alert"]',
          '.error',
          '[class*="error"]',
        ];

        const errors = [];
        errorSelectors.forEach(sel => {
          const els = document.querySelectorAll(sel);
          if (els.length > 0) {
            errors.push({
              selector: sel,
              count: els.length,
              texts: Array.from(els).map(e => e.textContent?.trim()).filter(Boolean),
            });
          }
        });

        return errors;
      });

      if (errorCheck.length > 0) {
        console.log('\n   Mensagens de erro encontradas:');
        errorCheck.forEach(e => {
          console.log(`   ${e.selector}: ${e.texts.join(', ')}`);
        });
      }
    }

    await page.screenshot({ path: 'final.png', fullPage: true });
    console.log('\n📸 Screenshots salvos');

  } catch (err) {
    console.error('\n❌ Erro:', err.message);
    await page.screenshot({ path: 'error.png', fullPage: true }).catch(() => {});
  } finally {
    await browser.close();
  }
}

main();

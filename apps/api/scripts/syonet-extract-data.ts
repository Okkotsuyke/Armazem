#!/usr/bin/env node
/**
 * Extrair dados completos de eventos e usuários do Syonet
 */

import { chromium } from 'playwright';
import * as fs from 'fs';

const SYONET_URL = process.env.SYONET_URL || 'https://viasul.syonet.com';
const USERNAME = process.env.SYONET_USERNAME || 'camila.brito';
const PASSWORD = process.env.SYONET_PASSWORD || 'C@mila1234';

async function main() {
  console.log('\n🔵 Extraindo Dados do Syonet\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // LOGIN
    console.log('1️⃣ Login...');
    await page.goto(SYONET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(18000);

    const inputs = await page.$$('input');
    await inputs[0].fill(USERNAME);
    await inputs[1].fill(PASSWORD);

    const enterBtn = await page.$('button:has-text("Entrar")');
    if (enterBtn) await enterBtn.click();
    await page.waitForTimeout(10000);

    const cookies = await context.cookies();
    const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    console.log('✅ Login OK\n');

    // OBTER EVENTOS DA EMPRESA 71
    console.log('2️⃣ Extraindo eventos da empresa 71...\n');

    const eventos = await page.evaluate(async (args) => {
      const res = await fetch(args.baseUrl + '/api/evento?idEmpresa=71&page=0&size=100', {
        headers: { 'Cookie': args.cookie, 'Accept': 'application/json' },
      });
      return res.json();
    }, { baseUrl: SYONET_URL, cookie: cookieStr });

    console.log(`   Total de eventos: ${eventos.length}`);

    if (eventos.length > 0) {
      // Mostrar estrutura do primeiro evento
      console.log('\n   Primeiro evento:');
      console.log(JSON.stringify(eventos[0], null, 2));

      // Mostrar alguns eventos
      console.log('\n   Primeiros 5 eventos:');
      eventos.slice(0, 5).forEach((evt: any, i: number) => {
        console.log(`\n   [${i}] ID: ${evt.idEvento}`);
        console.log(`       Cliente: ${evt.nmCliente || evt.nomeCliente || 'N/A'}`);
        console.log(`       Tipo: ${evt.idTipoEvento}`);
        console.log(`       Status: ${evt.idSituacaoEvento}`);
        console.log(`       Midia: ${evt.midia?.dsMidia || evt.dsMidia || 'N/A'}`);
        console.log(`       Data: ${evt.dataInc || evt.dtInc || 'N/A'}`);
      });
    }

    // SALVAR EVENTOS
    fs.writeFileSync('eventos-viasul-71.json', JSON.stringify(eventos, null, 2));
    console.log('\n💾 Eventos salvos em eventos-viasul-71.json');

    // OBTER USUÁRIOS DA EMPRESA 71
    console.log('\n3️⃣ Extraindo usuários da empresa 71...\n');

    const usuarios = await page.evaluate(async (args) => {
      const res = await fetch(args.baseUrl + '/api/usuario?idEmpresa=71', {
        headers: { 'Cookie': args.cookie, 'Accept': 'application/json' },
      });
      return res.json();
    }, { baseUrl: SYONET_URL, cookie: cookieStr });

    console.log(`   Total de usuários: ${usuarios.length}`);

    if (usuarios.length > 0) {
      console.log('\n   Primeiro usuário:');
      console.log(JSON.stringify(usuarios[0], null, 2));

      console.log('\n   Usuários (VL/Consultores):');
      usuarios.slice(0, 10).forEach((usr: any, i: number) => {
        console.log(`   [${i}] ID: ${usr.idUsuario}, Nome: ${usr.nmUsuario || usr.nome || 'N/A'}, Perfil: ${usr.perfil || 'N/A'}`);
      });
    }

    // SALVAR USUÁRIOS
    fs.writeFileSync('usuarios-viasul-71.json', JSON.stringify(usuarios, null, 2));
    console.log('\n💾 Usuários salvos em usuarios-viasul-71.json');

    // OBTER LISTA DE EMPRESAS COMPLETA
    console.log('\n4️⃣ Extraindo lista de empresas...\n');

    const empresas = await page.evaluate(async (args) => {
      const res = await fetch(args.baseUrl + '/api/empresa', {
        headers: { 'Cookie': args.cookie, 'Accept': 'application/json' },
      });
      const data = await res.json();
      return data.filter((e: any) => e.ativo).map((e: any) => ({
        id: e.idEmpresa,
        nome: e.nome,
        apelido: e.apelido,
        marca: e.marcaBandeira,
        dominio: e.idDominio,
        cidade: e.endereco?.cidade,
        estado: e.endereco?.estado,
      }));
    }, { baseUrl: SYONET_URL, cookie: cookieStr });

    console.log(`   Total de empresas: ${empresas.length}`);
    empresas.slice(0, 20).forEach((emp: any) => {
      console.log(`   [${emp.id}] ${emp.apelido} (${emp.marca}) - ${emp.cidade}/${emp.estado}`);
    });

    // SALVAR EMPRESAS
    fs.writeFileSync('empresas-syonet.json', JSON.stringify(empresas, null, 2));
    console.log('\n💾 Empresas salvas em empresas-syonet.json');

    // OBTER MÍDIAS
    console.log('\n5️⃣ Extraindo mídias...\n');

    const midias = await page.evaluate(async (args) => {
      const res = await fetch(args.baseUrl + '/api/midia', {
        headers: { 'Cookie': args.cookie, 'Accept': 'application/json' },
      });
      return res.json();
    }, { baseUrl: SYONET_URL, cookie: cookieStr });

    console.log(`   Total de mídias: ${midias.length}`);
    if (midias.length > 0 && midias[0].id !== undefined) {
      console.log('\n   Mídias:');
      midias.slice(0, 15).forEach((m: any) => {
        console.log(`   [${m.id}] ${m.nome || m.dsMidia || JSON.stringify(m)}`);
      });
    } else {
      // Tentar entender a estrutura
      console.log('\n   Estrutura da mídia:');
      console.log(JSON.stringify(midias[0], null, 2));
    }

    fs.writeFileSync('midias-syonet.json', JSON.stringify(midias, null, 2));
    console.log('\n💾 Mídias salvas em midias-syonet.json');

    console.log('\n✅ Extração concluída!');

  } catch (err) {
    console.error('\n❌ Erro:', err.message);
  } finally {
    await browser.close();
  }
}

main();

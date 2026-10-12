/**
 * Script de teste para conexão com o Syonet
 * Uso: npx tsx scripts/test-syonet-connection.ts
 */

import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Carregar variáveis de ambiente
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../apps/api/.env') });

import { syonetLogin, syonetLogout, isSyonetAuthenticated } from '../src/services/syonet-real-client';

async function testConnection() {
  console.log('\n========================================');
  console.log('🧪 TESTE DE CONEXÃO COM SYONET CRM');
  console.log('========================================\n');

  const config = {
    baseUrl: process.env.SYONET_URL || 'https://viasul.syonet.com',
    username: process.env.SYONET_USERNAME || '',
    password: process.env.SYONET_PASSWORD || '',
  };

  console.log(`📍 URL: ${config.baseUrl}`);
  console.log(`👤 Usuário: ${config.username}`);
  console.log(`🔑 Senha: ${config.password ? '********' : 'NÃO DEFINIDA'}\n`);

  if (!config.username || !config.password) {
    console.error('❌ ERRO: Credenciais não configuradas no arquivo .env');
    console.log('\n📝 Configure as seguintes variáveis:');
    console.log('   SYONET_URL=https://viasul.syonet.com');
    console.log('   SYONET_USERNAME=seu_usuario');
    console.log('   SYONET_PASSWORD=sua_senha\n');
    process.exit(1);
  }

  try {
    // 1. TESTAR LOGIN
    console.log('1️⃣ Testando login no Syonet...');
    const loginSuccess = await syonetLogin(config);

    if (!loginSuccess) {
      console.error('\n❌ FALHA NO LOGIN');
      console.log('\nPossíveis causas:');
      console.log('   - Credenciais incorretas');
      console.log('   - Usuário sem permissão');
      console.log('   - Syonet fora do ar');
      console.log('   - Problema de rede\n');
      process.exit(1);
    }

    console.log('\n✅ LOGIN REALIZADO COM SUCESSO!\n');

    // 2. VERIFICAR SESSION
    console.log('2️⃣ Status da sessão:');
    console.log(`   Autenticado: ${isSyonetAuthenticated() ? 'Sim' : 'Não'}\n`);

    // 3. TESTAR APIs
    console.log('3️⃣ Testando APIs internas do Syonet...\n');

    // Importar funções de extração
    const { extractFunilData, extractProductivityData } = await import('../src/services/syonet-real-client');

    // Testar extração de funil
    console.log('   📊 Testando extração de FUNIL...');
    try {
      const funilData = await extractFunilData(config);
      console.log(`      ✅ Sucesso! ${funilData.length} registros retornados`);

      if (funilData.length > 0) {
        console.log('\n      Dados de exemplo:');
        const sample = funilData[0];
        console.log(`         Loja: ${sample.storeName}`);
        console.log(`         Leads: ${sample.leadsTotal}`);
        console.log(`         Agendamentos: ${sample.appointmentsTotal}`);
        console.log(`         Vendas: ${sample.salesTotal}`);
      }
    } catch (err: any) {
      console.log(`      ⚠️ Erro na extração: ${err.message}`);
    }

    console.log('');

    // Testar extração de produtividade
    console.log('   📊 Testando extração de PRODUTIVIDADE...');
    try {
      const prodData = await extractProductivityData(config);
      console.log(`      ✅ Sucesso! ${prodData.length} registros retornados`);

      if (prodData.length > 0) {
        console.log('\n      Dados de exemplo:');
        const sample = prodData[0];
        console.log(`         VL: ${sample.vlUserName}`);
        console.log(`         Leads Total: ${sample.leadsTotal}`);
        console.log(`         Leads Aguardando: ${sample.leadsWaiting}`);
        console.log(`         Vendas: ${sample.salesSuccess}`);
      }
    } catch (err: any) {
      console.log(`      ⚠️ Erro na extração: ${err.message}`);
    }

    console.log('\n========================================');
    console.log('✅ TESTE CONCLUÍDO COM SUCESSO');
    console.log('========================================\n');

  } catch (error: any) {
    console.error('\n❌ ERRO DURANTE O TESTE:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Fechar sessão
    console.log('🔒 Encerrando sessão...');
    await syonetLogout();
    console.log('✅ Sessão encerrada\n');
  }
}

testConnection();

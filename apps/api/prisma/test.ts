/**
 * Testes de Integração - CRM EUROVIA
 *
 * Execute com: npx tsx prisma/test.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runTests() {
  console.log('🧪 Iniciando testes...\n');
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<boolean>) {
    try {
      const result = await fn();
      if (result) {
        console.log(`✅ ${name}`);
        passed++;
      } else {
        console.log(`❌ ${name}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${name} - Erro: ${error}`);
      failed++;
    }
  }

  // Test: Conexão com banco
  await test('Conexão com PostgreSQL', async () => {
    await prisma.$connect();
    return true;
  });

  // Test: Listar lojas
  await test('Listar lojas', async () => {
    const stores = await prisma.store.findMany();
    console.log(`   - ${stores.length} lojas encontradas`);
    return stores.length > 0;
  });

  // Test: Listar usuários
  await test('Listar usuários', async () => {
    const users = await prisma.user.findMany();
    console.log(`   - ${users.length} usuários encontrados`);
    return users.length > 0;
  });

  // Test: Listar VLs
  await test('Listar VL Consultants', async () => {
    const vls = await prisma.user.findMany({
      where: { role: 'VL_CONSULTANT' },
    });
    console.log(`   - ${vls.length} VLs encontrados`);
    return vls.length > 0;
  });

  // Test: Listar leads
  await test('Listar leads', async () => {
    const leads = await prisma.lead.findMany({
      take: 5,
      orderBy: { receivedAt: 'desc' },
    });
    console.log(`   - ${leads.length} leads (amostra)`);
    return true;
  });

  // Test: Listar agendamentos
  await test('Listar agendamentos', async () => {
    const appointments = await prisma.appointment.findMany({
      take: 5,
      orderBy: { appointmentDate: 'asc' },
    });
    console.log(`   - ${appointments.length} agendamentos (amostra)`);
    return true;
  });

  // Test: Dashboard - Overview
  await test('Dashboard Overview', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [leads, appointments, sales] = await Promise.all([
      prisma.lead.count({
        where: { receivedAt: { gte: today, lt: tomorrow } },
      }),
      prisma.appointment.count({
        where: { appointmentDate: { gte: today, lt: tomorrow } },
      }),
      prisma.sale.count({
        where: { saleDate: { gte: today, lt: tomorrow } },
      }),
    ]);

    console.log(`   - Leads hoje: ${leads}`);
    console.log(`   - Agendamentos hoje: ${appointments}`);
    console.log(`   - Vendas hoje: ${sales}`);
    return true;
  });

  // Test: Produtividade - Portfolio
  await test('Produtividade - Portfolio', async () => {
    const vls = await prisma.user.findMany({
      where: { role: 'VL_CONSULTANT' },
      take: 1,
    });

    if (vls.length === 0) return true;

    const vl = vls[0];
    const stats = await prisma.lead.groupBy({
      by: ['statusNormalized'],
      where: { assignedVlId: vl.id },
      _count: true,
    });

    const total = stats.reduce((acc, s) => acc + s._count, 0);
    console.log(`   - VL: ${vl.name} - Total leads: ${total}`);
    return true;
  });

  // Test: Mídia fontes
  await test('Fontes de mídia normalizadas', async () => {
    const media = await prisma.mediaSource.findMany();
    console.log(`   - ${media.length} fontes de mídia`);
    return true;
  });

  // Test: Sync runs
  await test('Histórico de sync', async () => {
    const runs = await prisma.syncRun.findMany({
      take: 5,
      orderBy: { startedAt: 'desc' },
    });
    console.log(`   - ${runs.length} sync runs (amostra)`);
    return true;
  });

  // Desconectar
  await prisma.$disconnect();

  // Resumo
  console.log('\n═══════════════════════════════════════');
  console.log(`📊 Resultado: ${passed} passaram, ${failed} falharam`);
  console.log('═══════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

/**
 * Prisma Seed — CRM EUROVIA
 * Executar: pnpm db:seed
 */
import { PrismaClient, Plaza, UserRole, MediaCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ============================================================
  // STORES — 7 lojas conforme brief
  // ============================================================
  const stores = [
    {
      shortName: 'Dunas',
      syonetName: 'VIASUL DUNAS - CE',
      plaza: Plaza.FORTALEZA,
      city: 'Fortaleza',
      state: 'CE',
      timezone: 'America/Fortaleza',
    },
    {
      shortName: 'Washington Soares',
      syonetName: 'BYD WASHINGTON SOARES - CE',
      plaza: Plaza.FORTALEZA,
      city: 'Fortaleza',
      state: 'CE',
      timezone: 'America/Fortaleza',
    },
    {
      shortName: 'Iguatemi',
      syonetName: 'EUROVIA IGUATEMI - BA',
      plaza: Plaza.SALVADOR,
      city: 'Salvador',
      state: 'BA',
      timezone: 'America/Bahia',
    },
    {
      shortName: 'Lauro',
      syonetName: 'EUROVIA LAURO - BA',
      plaza: Plaza.SALVADOR,
      city: 'Salvador',
      state: 'BA',
      timezone: 'America/Bahia',
    },
    {
      shortName: 'Bonocô',
      syonetName: 'VIA 1 BONOCO - BA',
      plaza: Plaza.SALVADOR,
      city: 'Salvador',
      state: 'BA',
      timezone: 'America/Bahia',
    },
    {
      shortName: 'Paralela',
      syonetName: 'NISSAN PARALELA - BA',
      plaza: Plaza.SALVADOR,
      city: 'Salvador',
      state: 'BA',
      timezone: 'America/Bahia',
    },
    {
      shortName: 'Caminho das Árvores',
      syonetName: 'BYD CAMINHO DAS ARVORES - BA',
      plaza: Plaza.SALVADOR,
      city: 'Salvador',
      state: 'BA',
      timezone: 'America/Bahia',
    },
  ];

  for (const store of stores) {
    await prisma.store.upsert({
      where: { syonetName: store.syonetName },
      update: store,
      create: store,
    });
  }
  console.log(`✅ ${stores.length} stores seeded`);

  // ============================================================
  // MEDIA SOURCES — mídias conforme brief
  // ============================================================
  const mediaSources = [
    { rawName: 'CONVERX',        normalizedName: 'CONVERX',        category: MediaCategory.PAID },
    { rawName: 'DIRECT',          normalizedName: 'DIRECT',          category: MediaCategory.ORGANIC },
    { rawName: 'FACEBOOKADS',     normalizedName: 'FACEBOOK ADS',   category: MediaCategory.PAID },
    { rawName: 'FB',              normalizedName: 'FACEBOOK',        category: MediaCategory.PAID },
    { rawName: 'Facebook',        normalizedName: 'FACEBOOK',        category: MediaCategory.PAID },
    { rawName: 'FACEBOOKADS',     normalizedName: 'FACEBOOK ADS',   category: MediaCategory.PAID },
    { rawName: 'GOOGLE',          normalizedName: 'GOOGLE',          category: MediaCategory.PAID },
    { rawName: 'Google',          normalizedName: 'GOOGLE',          category: MediaCategory.PAID },
    { rawName: 'GOOGLESM',        normalizedName: 'GOOGLE SM',       category: MediaCategory.PAID },
    { rawName: 'GOOGLESMDISCOVERY', normalizedName: 'GOOGLE SM DISCOVERY', category: MediaCategory.PAID },
    { rawName: 'IG',              normalizedName: 'INSTAGRAM',        category: MediaCategory.PAID },
    { rawName: 'Instagram',       normalizedName: 'INSTAGRAM',       category: MediaCategory.PAID },
    { rawName: 'INSTAGRAM',       normalizedName: 'INSTAGRAM',       category: MediaCategory.PAID },
    { rawName: 'INDICACAO LEADS', normalizedName: 'INDICACAO LEADS', category: MediaCategory.REFERRAL },
    { rawName: 'LEADFY',          normalizedName: 'LEADFY',           category: MediaCategory.PAID },
    { rawName: 'Leadfy',          normalizedName: 'LEADFY',           category: MediaCategory.PAID },
    { rawName: 'LEADFY FACEBOOK', normalizedName: 'LEADFY FACEBOOK',  category: MediaCategory.PAID },
    { rawName: 'LWLCO',           normalizedName: 'LWLCO',           category: MediaCategory.PAID },
    { rawName: 'OLX',             normalizedName: 'OLX',              category: MediaCategory.PAID },
    { rawName: 'ORGANICO',        normalizedName: 'ORGANICO',         category: MediaCategory.ORGANIC },
    { rawName: 'Organico',        normalizedName: 'ORGANICO',         category: MediaCategory.ORGANIC },
    { rawName: 'OUTROS',          normalizedName: 'OUTROS',           category: MediaCategory.OTHER },
    { rawName: 'WEBMOTORS',       normalizedName: 'WEBMOTORS',        category: MediaCategory.PAID },
    { rawName: 'WHATSAPP',        normalizedName: 'WHATSAPP',         category: MediaCategory.OTHER },
    { rawName: 'WHATSAPP BDC',   normalizedName: 'WHATSAPP BDC',    category: MediaCategory.OTHER },
    { rawName: 'WHATSAPP FACEBOOK', normalizedName: 'WHATSAPP FACEBOOK', category: MediaCategory.PAID },
    { rawName: 'TOTAL',           normalizedName: 'TOTAL',            category: MediaCategory.OTHER },
  ];

  for (const media of mediaSources) {
    await prisma.mediaSource.upsert({
      where: { rawName: media.rawName },
      update: { normalizedName: media.normalizedName, category: media.category },
      create: media,
    });
  }
  console.log(`✅ ${mediaSources.length} media sources seeded`);

  // ============================================================
  // USERS — Admin + 5 consultores [VL] conforme brief
  // ============================================================
  const passwordHash = await bcrypt.hash('password123', 12);

  // Admin
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { name: 'Administrador', role: UserRole.ADMIN, password: passwordHash, active: true },
    create: {
      name: 'Administrador',
      username: 'admin',
      email: 'admin@eurovia.com.br',
      password: passwordHash,
      role: UserRole.ADMIN,
      active: true,
    },
  });

  // Consultores [VL] — seed conforme brief (não hardcoded para sempre)
  const dunasStore = await prisma.store.findUniqueOrThrow({ where: { syonetName: 'VIASUL DUNAS - CE' } });
  const iguatemiStore = await prisma.store.findUniqueOrThrow({ where: { syonetName: 'EUROVIA IGUATEMI - BA' } });

  const vlConsultants = [
    { name: 'Monalysa Silva',     username: 'MONALYSA.SILVA',     storeId: dunasStore.id },
    { name: 'Rebeca Wanderley',   username: 'REBECA.WANDERLEY',   storeId: iguatemiStore.id },
    { name: 'Sandra Silva',        username: 'SANDRA.SILVA',        storeId: dunasStore.id },
    { name: 'Samara Lira',        username: 'SAMARA.LIRA',         storeId: iguatemiStore.id },
    { name: 'Tafnes Silva',       username: 'TAFNES.SILVA',       storeId: dunasStore.id },
  ];

  for (const vl of vlConsultants) {
    await prisma.user.upsert({
      where: { username: vl.username },
      update: { name: vl.name, role: UserRole.VL_CONSULTANT, password: passwordHash, storeId: vl.storeId },
      create: {
        name: vl.name,
        username: vl.username,
        password: passwordHash,
        role: UserRole.VL_CONSULTANT,
        storeId: vl.storeId,
        active: true,
      },
    });
  }
  console.log(`✅ ${vlConsultants.length} VL consultants seeded`);

  // Manager
  await prisma.user.upsert({
    where: { username: 'gerente' },
    update: { name: 'Gerente Geral', role: UserRole.MANAGER, password: passwordHash },
    create: {
      name: 'Gerente Geral',
      username: 'gerente',
      password: passwordHash,
      role: UserRole.MANAGER,
      active: true,
    },
  });

  console.log('');
  console.log('🎉 Seed completo!');
  console.log('');
  console.log('📋 Usuários criados:');
  console.log('   admin     / password123  (ADMIN)');
  console.log('   gerente   / password123  (MANAGER)');
  vlConsultants.forEach(vl => {
    console.log(`   ${vl.username.toLowerCase()} / password123  (VL_CONSULTANT)`);
  });

  // ============================================================
  // DASHBOARD_USERS — Usuário avaliador do dashboard
  // ============================================================
  const evaluatorHash = await bcrypt.hash('evaluator2024', 12);

  await prisma.dashboardUser.upsert({
    where: { username: 'avaliador' },
    update: {
      name: 'Avaliador do Dashboard',
      passwordHash: evaluatorHash,
      role: 'ADMIN',
      active: true,
    },
    create: {
      username: 'avaliador',
      name: 'Avaliador do Dashboard',
      passwordHash: evaluatorHash,
      role: 'ADMIN',
      active: true,
    },
  });

  console.log('');
  console.log('📊 Dashboard Users criados:');
  console.log('   avaliador / evaluator2024  (ADMIN - único usuário)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

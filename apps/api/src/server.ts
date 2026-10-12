/**
 * Server bootstrap — CRM EUROVIA API
 */
import { buildApp } from './app';
import { startSyncScheduler, stopSyncScheduler } from './services/sync-scheduler';

const PORT = parseInt(process.env.PORT ?? '3001', 10);

async function start() {
  const app = await buildApp();

  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀 API running at http://localhost:${PORT}`);
    console.log(`📚 Health: http://localhost:${PORT}/health`);
    console.log(`🔐 Auth:  http://localhost:${PORT}/api/v1/auth/login`);

    // Iniciar scheduler de sincronização
    startSyncScheduler();

    console.log(`\n📊 Endpoints de Analytics:`);
    console.log(`   GET /api/v1/analytics/overview`);
    console.log(`   GET /api/v1/analytics/by-store`);
    console.log(`   GET /api/v1/analytics/by-vl`);
    console.log(`   GET /api/v1/analytics/by-media`);
    console.log(`   GET /api/v1/analytics/productivity`);
    console.log(`\n🔗 Dashboard Auth:`);
    console.log(`   POST /api/v1/dashboard/auth/login`);
    console.log(`   GET /api/v1/dashboard/auth/me`);
    console.log(`\n🔄 Sync:`);
    console.log(`   GET /api/v1/sync/status`);
    console.log(`   POST /api/v1/sync/run`);
    console.log(`   GET /api/v1/sync/history`);

  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Cleanup ao encerrar
process.on('SIGTERM', () => {
  console.log('\n📤 Encerrando servidor...');
  stopSyncScheduler();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n📤 Encerrando servidor...');
  stopSyncScheduler();
  process.exit(0);
});

start();

/**
 * Script de Migração: sync_metrics + dashboard_users
 * Executar: node scripts/migrate-sync-metrics.js
 */
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/crm_eurovia';

async function migrate() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('🔌 Conectado ao PostgreSQL');

    // 1. Criar tabela sync_metrics
    console.log('\n📦 Criando tabela sync_metrics...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS sync_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        extraction_date DATE NOT NULL,
        store_id VARCHAR(100) NOT NULL,
        media_source_id VARCHAR(100),
        vl_user_id VARCHAR(100),
        leads_total INT DEFAULT 0,
        leads_to_vs INT DEFAULT 0,
        leads_to_bdc INT DEFAULT 0,
        appointments_total INT DEFAULT 0,
        appointments_confirmed INT DEFAULT 0,
        flow_total INT DEFAULT 0,
        sales_total INT DEFAULT 0,
        sync_batch_id VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(extraction_date, store_id, vl_user_id)
      );
    `);
    console.log('✅ Tabela sync_metrics criada');

    // Índices
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sync_metrics_date ON sync_metrics(extraction_date);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sync_metrics_store ON sync_metrics(store_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sync_metrics_vl ON sync_metrics(vl_user_id);`);
    console.log('✅ Índices criados');

    // 2. Criar tabela dashboard_users
    console.log('\n📦 Criando tabela dashboard_users...');
    await client.query(`
      DROP TABLE IF EXISTS dashboard_users CASCADE;
      CREATE TABLE dashboard_users (
        id UUID PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(200) NOT NULL,
        role VARCHAR(20) DEFAULT 'VIEWER',
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);
    console.log('✅ Tabela dashboard_users criada');

    // 3. Inserir usuário avaliador
    const passwordHash = await bcrypt.hash('evaluator2024', 12);
    const userId = '00000000-0000-0000-0000-000000000001';

    console.log('\n👤 Criando usuário avaliador...');
    await client.query(`
      INSERT INTO dashboard_users (id, username, password_hash, name, role, active)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (username) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        active = EXCLUDED.active,
        updated_at = now()
    `, [userId, 'avaliador', passwordHash, 'Avaliador do Dashboard', 'ADMIN', true]);
    console.log('✅ Usuário avaliador criado: avaliador / evaluator2024');

    // 4. Criar views
    console.log('\n📊 Criando views para dashboard...');

    await client.query(`
      CREATE OR REPLACE VIEW vw_conversion_global AS
      SELECT
        sm.extraction_date,
        s."shortName" AS loja,
        s.plaza,
        COALESCE(sm.leads_total, 0) AS leads_total,
        COALESCE(sm.flow_total, 0) AS flow_total,
        COALESCE(sm.appointments_total, 0) AS appointments_total,
        COALESCE(sm.sales_total, 0) AS sales_total,
        ROUND(
          (COALESCE(sm.sales_total, 0)::NUMERIC /
           NULLIF(COALESCE(sm.leads_total, 0), 0)) * 100, 2
        ) AS conversion_rate,
        ROUND(
          (COALESCE(sm.flow_total, 0)::NUMERIC /
           NULLIF(COALESCE(sm.appointments_total, 0), 0)) * 100, 2
        ) AS show_rate
      FROM sync_metrics sm
      JOIN stores s ON sm.store_id = s.id;
    `);
    console.log('✅ View vw_conversion_global criada');

    await client.query(`
      CREATE OR REPLACE VIEW vw_performance_vl AS
      SELECT
        sm.extraction_date,
        u.name AS vl_name,
        u.username,
        s."shortName" AS loja,
        COALESCE(sm.leads_total, 0) AS leads_total,
        COALESCE(sm.leads_to_vs, 0) AS leads_to_vs,
        COALESCE(sm.appointments_total, 0) AS appointments_total,
        COALESCE(sm.flow_total, 0) AS flow_total,
        COALESCE(sm.sales_total, 0) AS sales_total,
        ROUND(
          (COALESCE(sm.appointments_total, 0)::NUMERIC /
           NULLIF(COALESCE(sm.leads_total, 0), 0)) * 100, 2
        ) AS appointment_rate,
        ROUND(
          (COALESCE(sm.sales_total, 0)::NUMERIC /
           NULLIF(COALESCE(sm.leads_total, 0), 0)) * 100, 2
        ) AS closing_rate
      FROM sync_metrics sm
      JOIN users u ON sm.vl_user_id = u.id
      JOIN stores s ON sm.store_id = s.id
      WHERE u.role = 'VL_CONSULTANT';
    `);
    console.log('✅ View vw_performance_vl criada');

    await client.query(`
      CREATE OR REPLACE VIEW vw_metrics_by_media AS
      SELECT
        sm.extraction_date,
        ms."normalizedName" AS midia,
        ms.category,
        SUM(COALESCE(sm.leads_total, 0)) AS leads_total,
        SUM(COALESCE(sm.sales_total, 0)) AS sales_total,
        ROUND(
          (SUM(COALESCE(sm.sales_total, 0))::NUMERIC /
           NULLIF(SUM(COALESCE(sm.leads_total, 0)), 0)) * 100, 2
        ) AS conversion_rate
      FROM sync_metrics sm
      JOIN media_sources ms ON sm.media_source_id = ms.id
      GROUP BY sm.extraction_date, ms."normalizedName", ms.category;
    `);
    console.log('✅ View vw_metrics_by_media criada');

    // 5. Verificar resultado
    console.log('\n📋 Verificando tabelas...');
    const result = await client.query(`
      SELECT 'sync_metrics' AS tabela, COUNT(*) AS registros FROM sync_metrics
      UNION ALL
      SELECT 'dashboard_users', COUNT(*) FROM dashboard_users
      UNION ALL
      SELECT 'stores', COUNT(*) FROM stores
      UNION ALL
      SELECT 'users', COUNT(*) FROM users
      UNION ALL
      SELECT 'media_sources', COUNT(*) FROM media_sources;
    `);

    console.log('\n📊 Status das tabelas:');
    result.rows.forEach(row => {
      console.log(`   ${row.tabela}: ${row.registros} registros`);
    });

    // Mostrar usuários
    const users = await client.query(`SELECT username, name, role FROM dashboard_users`);
    console.log('\n👥 Usuários do Dashboard:');
    users.rows.forEach(u => console.log(`   ${u.username} - ${u.name} (${u.role})`));

    console.log('\n🎉 Migração concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();

-- ============================================================
-- MIGRATION SQL: CRM EUROVIA - SyncMetrics + DashboardUsers
-- Executar diretamente no PostgreSQL
-- ============================================================

-- ============================================================
-- 1. Tabela: sync_metrics
-- ============================================================
CREATE TABLE IF NOT EXISTS sync_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    extraction_date DATE NOT NULL,
    store_id VARCHAR(100) NOT NULL REFERENCES stores(id),
    media_source_id VARCHAR(100) REFERENCES media_sources(id),
    vl_user_id VARCHAR(100) REFERENCES users(id),

    -- Métricas de Leads
    leads_total INT DEFAULT 0,
    leads_to_vs INT DEFAULT 0,
    leads_to_bdc INT DEFAULT 0,

    -- Métricas de Agendamento
    appointments_total INT DEFAULT 0,
    appointments_confirmed INT DEFAULT 0,

    -- Métricas de Fluxo
    flow_total INT DEFAULT 0,

    -- Métricas de Venda
    sales_total INT DEFAULT 0,

    -- Metadados de sync
    sync_batch_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(extraction_date, store_id, vl_user_id)
);

-- Índices para sync_metrics
CREATE INDEX IF NOT EXISTS idx_sync_metrics_date ON sync_metrics(extraction_date);
CREATE INDEX IF NOT EXISTS idx_sync_metrics_store ON sync_metrics(store_id);
CREATE INDEX IF NOT EXISTS idx_sync_metrics_vl ON sync_metrics(vl_user_id);

-- ============================================================
-- 2. Tabela: dashboard_users
-- ============================================================
CREATE TABLE IF NOT EXISTS dashboard_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(200) NOT NULL,
    role VARCHAR(20) DEFAULT 'VIEWER',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. Inserir usuário avaliador
-- ============================================================
-- Hash bcrypt para 'evaluator2024'
INSERT INTO dashboard_users (username, password_hash, name, role, active)
VALUES (
    'avaliador',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.G',
    'Avaliador do Dashboard',
    'ADMIN',
    true
)
ON CONFLICT (username) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    active = EXCLUDED.active,
    updated_at = now();

-- ============================================================
-- 4. Views para Dashboard
-- ============================================================

-- View: Taxa de Conversão Global
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
         NULLIF(COALESCE(sm.leads_total, 0), 0)) * 100,
        2
    ) AS conversion_rate,
    ROUND(
        (COALESCE(sm.flow_total, 0)::NUMERIC /
         NULLIF(COALESCE(sm.appointments_total, 0), 0)) * 100,
        2
    ) AS show_rate
FROM sync_metrics sm
JOIN stores s ON sm.store_id = s.id
WHERE sm.vl_user_id IS NULL
  AND sm.media_source_id IS NULL;

-- View: Performance VL
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
         NULLIF(COALESCE(sm.leads_total, 0), 0)) * 100,
        2
    ) AS appointment_rate,
    ROUND(
        (COALESCE(sm.sales_total, 0)::NUMERIC /
         NULLIF(COALESCE(sm.leads_total, 0), 0)) * 100,
        2
    ) AS closing_rate
FROM sync_metrics sm
JOIN users u ON sm.vl_user_id = u.id
JOIN stores s ON sm.store_id = s.id
WHERE u.role = 'VL_CONSULTANT';

-- View: Resumo por Mídia
CREATE OR REPLACE VIEW vw_metrics_by_media AS
SELECT
    sm.extraction_date,
    ms."normalizedName" AS midia,
    ms.category,
    SUM(COALESCE(sm.leads_total, 0)) AS leads_total,
    SUM(COALESCE(sm.sales_total, 0)) AS sales_total,
    ROUND(
        (SUM(COALESCE(sm.sales_total, 0))::NUMERIC /
         NULLIF(SUM(COALESCE(sm.leads_total, 0)), 0)) * 100,
        2
    ) AS conversion_rate
FROM sync_metrics sm
JOIN media_sources ms ON sm.media_source_id = ms.id
WHERE sm.vl_user_id IS NULL
GROUP BY sm.extraction_date, ms."normalizedName", ms.category;

-- ============================================================
-- 5. Verificar resultado
-- ============================================================
SELECT 'sync_metrics' AS tabela, COUNT(*) AS registros FROM sync_metrics
UNION ALL
SELECT 'dashboard_users', COUNT(*) FROM dashboard_users
UNION ALL
SELECT 'vw_conversion_global', COUNT(*) FROM vw_conversion_global
UNION ALL
SELECT 'vw_performance_vl', COUNT(*) FROM vw_performance_vl
UNION ALL
SELECT 'vw_metrics_by_media', COUNT(*) FROM vw_metrics_by_media;

-- ============================================================
-- SEED SQL: CRM EUROVIA - Dashboard User
-- Executar diretamente no PostgreSQL
-- ============================================================

-- Criar tabela dashboard_users se não existir
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

-- Criar função para hash de senha (já deve existir se usar pgcrypto)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Inserir usuário avaliador
-- Senha: evaluator2024 (hash gerado com bcrypt via hex encode do bcrypt)
INSERT INTO dashboard_users (username, password_hash, name, role, active)
VALUES (
    'avaliador',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.G', -- evaluator2024
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

-- Verificar criação
SELECT id, username, name, role, active, created_at
FROM dashboard_users
WHERE username = 'avaliador';

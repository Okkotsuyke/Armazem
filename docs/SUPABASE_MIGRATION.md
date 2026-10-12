# Migração para Supabase

## Passo a Passo

### 1. Criar Projeto Supabase

1. Acesse https://supabase.com/dashboard
2. Clique em "New Project"
3. Preencha:
   - Name: `crm-eurovia`
   - Database Password: Gere uma senha forte
   - Region: `São Paulo (gru)` ou mais próxima
   - Pricing: Free (começar) ou Pro (se precisar)

4. **Anote as credenciais**:
   - Project URL: `https://xxxx.supabase.co`
   - `DB Password` (nas settings)
   - `anon public` key
   - `service_role` key

### 2. Obter Connection String

1. No Supabase Dashboard → Settings → Database
2. Copie a Connection string (URI) para:
   - Direct connection (para migrações)
   - Pooled connection (para aplicação)

Connection string direto:
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

Connection string com Pooler (recomendado para serverless):
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

### 3. Atualizar .env

```bash
# No apps/api/.env

# ANTES (local)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/crm_eurovia"

# DEPOIS (Supabase)
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGci..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."
```

### 4. Preparar Schema Prisma

O schema atual já é compatível com Supabase (PostgreSQL).

Para migração:

```bash
# 1. Resetar banco de dados (SE FOR DEV/TESTE)
npx prisma db push --force-reset

# 2. Criar migração inicial
npx prisma migrate dev --name init_supabase

# 3. Em produção, aplicar migrações
npx prisma migrate deploy
```

### 5. Migração de Dados (se houver)

Se precisar migrar dados do banco local:

```sql
-- No Supabase SQL Editor, execute:

-- 1. Desabilitar RLS temporariamente
ALTER TABLE lead DISABLE ROW LEVEL SECURITY;
ALTER TABLE store DISABLE ROW LEVEL SECURITY;
-- ... outras tabelas

-- 2. Importar dados (via pg_dump)
pg_dump -h localhost -U postgres -d crm_eurovia | psql $DATABASE_URL

-- 3. Reabilitar RLS
ALTER TABLE lead ENABLE ROW LEVEL SECURITY;
ALTER TABLE store ENABLE ROW LEVEL SECURITY;
-- ... outras tabelas
```

### 6. Configurar Row Level Security (RLS)

Adicionar policies para cada tabela sensitive:

```sql
-- Exemplo para leads
ALTER TABLE lead ENABLE ROW LEVEL SECURITY;

-- Usuários veem apenas suas próprias leads
CREATE POLICY "Users can view own leads" ON lead
  FOR SELECT
  USING (user_id = auth.uid());

-- Apenas admins podem criar leads
CREATE POLICY "Admins can create leads" ON lead
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'ADMIN');
```

### 7. Configurar Auth (substituir JWT próprio)

O Supabase Auth elimina `@fastify/jwt`:

```typescript
// ANTES (@fastify/jwt)
const token = fastify.jwt.sign({ userId: user.id });

// DEPOIS (Supabase Auth)
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
})
```

### 8. Configurar Storage

```sql
-- No Supabase Dashboard → Storage

-- Criar buckets:
-- 1. "avatars" - fotos de perfil
-- 2. "documents" - documentos
-- 3. "exports" - exports CSV/Excel

-- Policies de exemplo:
CREATE POLICY "Users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid() IS NOT NULL
  );
```

### 9. Verificar Connection Limits

Supabase Free: 60 conexões simultâneas
Supabase Pro: 200 conexões simultâneas

Para serverless/Vercel, usar connection pooler:

```typescript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["connection limiting"]
}
```

## Checklist de Migração

- [ ] Criar projeto Supabase
- [ ] Obter credenciais
- [ ] Atualizar .env com DATABASE_URL
- [ ] Testar conexão local → Supabase
- [ ] Executar `prisma db push` ou `prisma migrate`
- [ ] Migrar dados (se houver)
- [ ] Configurar RLS policies
- [ ] Migrar autenticação para Supabase Auth
- [ ] Configurar storage buckets
- [ ] Testar aplicação local com Supabase
- [ ] Deploy para Vercel
- [ ] Verificar em produção

## Troubleshooting

### Erro: Connection timeout
```
Error: P1001: Can't reach database server
```
→ Verificar DATABASE_URL, firewall, IP allowlist

### Erro: Too many connections
```
Error: P2024: Connection pool exhausted
```
→ Usar connection string com pooler (`pooler.supabase.com:6543`)

### Erro: RLS blocking access
```
Error: RLS policy prevented the operation
```
→ Verificar policies, usar service_role para admin ops

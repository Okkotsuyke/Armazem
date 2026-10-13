# Guia de Configuracao de Variaveis de Ambiente - Vercel CRM EUROVIA

Este guia descreve todas as variaveis de ambiente necessarias para configurar o projeto CRM EUROVIA na Vercel.

---

## Visao Geral da Arquitetura

O projeto CRM EUROVIA e um **monorepo** com dois projetos Vercel:

| Projeto | Descricao | URL Tipica |
|---------|-----------|------------|
| `crm-eurovia` | Frontend Next.js 15 | `https://crm-eurovia.vercel.app` |
| `api` | Backend Fastify + Prisma | `https://api-crm-eurovia.vercel.app` |

---

## Projeto API - Variaveis de Producao

### 1. DATABASE_URL
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Como obter:**
1. Acesse https://supabase.com/dashboard
2. Selecione o projeto
3. Va em **Settings > Database**
4. Copie a **Connection string** (Transaction mode recomendado)
5. Substitua `postgres` por `postgres.[PROJECT_REF]`

### 2. JWT_SECRET
```
[minimo 32 caracteres]
```

**Gerar:**
```bash
openssl rand -base64 32
```

**Importante:** Use o mesmo valor em todos os ambientes para evitar invalidacao de sessoes.

### 3. SYONET_URL
```
https://viasul.syonet.com
```

### 4. SYONET_USERNAME
```
[usuario_fornecido_pela_empresa]
```

### 5. SYONET_PASSWORD
```
[senha_fornecida_pela_empresa]
```

### 6. SYNC_ENABLED
```
true
```

### 7. NODE_ENV
```
production
```

### 8. SENTRY_DSN (Opcional)
```
https://[KEY]@o[ORG].ingest.sentry.io/[PROJECT]
```

**Como obter:**
1. Acesse https://sentry.io
2. Selecione a organizacao
3. Va em **Settings > Projects > [Projeto API] > Client Keys (DSN)**

---

## Projeto Web - Variaveis de Producao

### 1. NEXT_PUBLIC_API_URL
```
https://api-crm-eurovia.vercel.app
```
Substitua pelo dominio configurado do projeto API.

### 2. NEXT_PUBLIC_SUPABASE_URL
```
https://[PROJECT_REF].supabase.co
```

**Como obter:**
1. Acesse https://supabase.com/dashboard
2. Selecione o projeto
3. Va em **Settings > API**
4. Copie o valor em **Project URL**

### 3. NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Como obter:**
1. Acesse https://supabase.com/dashboard
2. Selecione o projeto
3. Va em **Settings > API**
4. Copie a **anon public** key em **Project API keys**

### 4. NEXT_PUBLIC_APP_URL
```
https://crm.eurovia.com.br
```
Ou dominio configurado para o frontend.

---

## Passo a Passo para Configurar

### 1. Acesse vercel.com/dashboard

Acesse o dashboard da Vercel:
```
https://vercel.com/dashboard
```

### 2. Selecione o projeto

Escolha entre:
- **api** ou **api-crm-eurovia** (Backend Fastify)
- **crm-eurovia** (Frontend Next.js)

### 3. Settings > Environment Variables

Va em **Settings > Environment Variables**

### 4. Adicione cada variavel

Para cada variavel:
1. Preencha o campo **Name** com o nome exato da variavel
2. Preencha o campo **Value** com o valor
3. Selecione o **Environment** correto (Production, Preview, Development)
4. Clique **Save**

### 5. Deploy para aplicar

Apos configurar as variaveis:

**Opcao A - Redeploy automatico:**
- Va em **Deployments**
- Clique em **Redeploy** no ultimo deploy

**Opcao B - Deploy manual:**
```bash
vercel --prod
```

---

## Variaveis de Desenvolvimento

### API (apps/api/.env)

```bash
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
JWT_SECRET=[mesmo valor da producao]
SYONET_URL=https://viasul.syonet.com
SYONET_USERNAME=
SYONET_PASSWORD=
SYNC_ENABLED=false
NODE_ENV=development
```

### Web (apps/web/.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[sua_chave_anon]
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Comandos Uteis (CLI Vercel)

### Linkar projeto localmente
```bash
vercel link
```

### Pull variables para .env.local
```bash
vercel env pull .env.local
```

### Adicionar variavel via CLI
```bash
vercel env add DATABASE_URL production
```

### Listar variaveis
```bash
vercel env ls production
```

### Encriptar variavel
```bash
vercel env add SYONET_PASSWORD --encrypt production
```

---

## Verificacao Posterior ao Deploy

### Verificar health check da API
```
https://api-crm-eurovia.vercel.app/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "timestamp": "2026-10-13T12:00:00.000Z"
}
```

### Verificar logs
1. Va em **Deployments > [deploy mais recente]**
2. Clique em **View Runtime Logs**

### Verificar cron jobs
Va em **Settings > Cron Jobs** para verificar se os jobs estao configurados.

---

## Checklist Final

### Projeto API
- [ ] DATABASE_URL configurado
- [ ] JWT_SECRET configurado (min 32 chars)
- [ ] SYONET_URL = https://viasul.syonet.com
- [ ] SYONET_USERNAME configurado
- [ ] SYONET_PASSWORD configurado
- [ ] SYNC_ENABLED = true
- [ ] NODE_ENV = production
- [ ] SENTRY_DSN (opcional)

### Projeto Web
- [ ] NEXT_PUBLIC_API_URL configurado
- [ ] NEXT_PUBLIC_SUPABASE_URL configurado
- [ ] NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY configurado
- [ ] NEXT_PUBLIC_APP_URL configurado

---

## Seguranca

### Variaveis sensiveis (usar encriptacao)
- `SYONET_PASSWORD`
- `JWT_SECRET`
- `RESEND_API_KEY`
- `DATABASE_URL`

### Nao commite arquivos .env
O projeto ja esta configurado com `.gitignore` para ignorar:
- `.env`
- `.env.local`
- `.env.*.local`

---

## Troubleshooting

| Problema | Solucao |
|----------|---------|
| Prisma Client not initialized | Verificar DATABASE_URL |
| Erro de autenticacao JWT | Verificar JWT_SECRET igual em todos ambientes |
| Erro de CORS | Verificar URL do frontend em ALLOWED_ORIGINS |
| Cron nao executa | Verificar SYNC_ENABLED=true e cron job configurado |

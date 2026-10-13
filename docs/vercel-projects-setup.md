# Configuracao de Projetos Vercel - CRM EUROVIA

Este guia explica como configurar os dois projetos Vercel para o monorepo do CRM EUROVIA.

## Visao Geral

O monorepo possui dois projetos Vercel independentes:

| Projeto | Stack | Root Directory | Vercel Project Name |
|---------|-------|----------------|---------------------|
| crm-eurovia | Next.js 15 | apps/web | crm-eurovia |
| api | Fastify | apps/api | crm-eurovia-api |

## Projeto crm-eurovia (Frontend Web)

### Configuracao

- **Stack:** Next.js 15 (App Router)
- **Root Directory:** `apps/web`
- **Build Command:** `pnpm turbo build --filter=@crm/web`
- **Output Directory:** `.next` (default)
- **Install Command:** `pnpm install`

### Variaveis de Ambiente Necessarias

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_API_URL=https://crm-eurovia-api.vercel.app
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

## Projeto api (Backend Fastify)

### Configuracao

- **Stack:** Other (Node.js)
- **Root Directory:** `apps/api`
- **Build Command:** `pnpm turbo build --filter=@crm/api`
- **Install Command:** `pnpm install`
- **Serverless Function Handler:** `api/index.ts`

### Variaveis de Ambiente Necessarias

```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx

# Database
DATABASE_URL=postgres://xxx

# Syonet CRM
SYONET_USERNAME=xxx
SYONET_PASSWORD=xxx

# Email (Resend)
RESEND_API_KEY=re_xxx

# Sentry
SENTRY_AUTH_TOKEN=xxx
SENTRY_ORG=xxx
SENTRY_PROJECT=api

# Vercel (automaticas)
VERCEL=1
NODE_ENV=production
```

## Passo a Passo de Configuracao

### 1. Linkar Projetos

Primeiro, configure cada projeto localmente:

```bash
# Na raiz do monorepo
cd apps/web
vercel link --project=crm-eurovia
cd ../..

cd apps/api
vercel link --project=crm-eurovia-api
cd ../..
```

### 2. Configurar Root Directory no Painel Vercel

Para cada projeto:

1. Acesse https://vercel.com/dashboard
2. Selecione o projeto
3. Va em **Settings > General**
4. Em **Root Directory**, insira:
   - `apps/web` para crm-eurovia
   - `apps/api` para crm-eurovia-api

### 3. Configurar Dominios

#### crm-eurovia (Frontend)
```
crm.eurovia.com.br (producao)
crm-eurovia.vercel.app (preview)
```

#### api (Backend)
```
api.eurovia.com.br (producao)
crm-eurovia-api.vercel.app (preview)
```

### 4. Configurar Environment Variables

#### No Painel Vercel

1. Va em **Settings > Environment Variables**
2. Adicione as variaveis para cada ambiente:
   - Production
   - Preview
   - Development

#### Via CLI

```bash
# Listar variaveis
vercel env ls

# Adicionar variavel
vercel env add NEXT_PUBLIC_SUPABASE_URL production
```

### 5. Deploy Inicial

```bash
# Deploy preview
cd apps/web && vercel
cd ../api && vercel
cd ..

# Deploy producao
cd apps/web && vercel --prod
cd ../api && vercel --prod
cd ..
```

## Comandos Uteis

### Listar Deploys

```bash
vercel ls
```

### Ver Logs

```bash
# Logs em tempo real
vercel logs https://crm-eurovia.vercel.app

# Logs de uma URL especifica
vercel logs crm-eurovia-api.vercel.app

# Com filtro
vercel logs crm-eurovia-api.vercel.app --filter=error
```

### Listar Environment Variables

```bash
vercel env ls
```

### Inspectar Projeto Atual

```bash
vercel project inspect
```

### Secrets (Variaveis Criptografadas)

```bash
# Adicionar secret (valor nao aparece em logs)
vercel env add SENTRY_AUTH_TOKEN production --secret

# Listar com valores (apenas local)
vercel env ls --token
```

## Configuracao de Domains Personalizados

### Via CLI

```bash
# Adicionar dominio
vercel domains add crm.eurovia.com.br

# Adicionar com redirect
vercel domains add www.crm.eurovia.com.br --redirect crm.eurovia.com.br
```

### Verificacao DNS

Apos adicionar o dominio, configure no Cloudflare:

```
Type    Name    Value
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
```

## Estrutura de Monorepo (Turborepo)

```
crm-eurovia/
├── apps/
│   ├── web/          # Next.js (projeto crm-eurovia)
│   └── api/          # Fastify (projeto crm-eurovia-api)
├── packages/
│   └── shared/       # Codigo compartilhado
├── turbo.json        # Configuracao Turborepo
├── pnpm-workspace.yaml
└── vercel.json       # Configuracao global (opcional)
```

## Troubleshooting

### Build Falha

```bash
# Ver build locally
pnpm turbo build --filter=@crm/web
pnpm turbo build --filter=@crm/api

# Ver logs do build
vercel logs url-do-deploy --build
```

### Variaveis de Ambiente Ausentes

```bash
# Verificar se estao configuradas
vercel env ls

# Pull local (se configurado)
vercel env pull .env.local
```

### Timeout em Functions

Para functions que precisam de mais tempo:

1. Va em **Settings > Functions**
2. Aumente o **Maximum Execution Timeout**

### Region de Database

Se usar Supabase, configure a mesma regiao:
- Supabase: `sa-east-1` (Sao Paulo)
- Vercel: `iad1` (Virginia) ou `gru1` (Sao Paulo)

## Links Uteis

- Dashboard Vercel: https://vercel.com/dashboard
- Documentacao: https://vercel.com/docs
- CLI Reference: https://vercel.com/docs/cli

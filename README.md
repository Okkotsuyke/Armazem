# CRM EUROVIA

Sistema de CRM para a equipe de vendas da EUROVIA, integrado com o Syonet (sistema de gestão da empresa).

## Stack

### Infraestrutura
| Serviço | Uso |
|---------|-----|
| [Vercel](https://vercel.com) | Deploy e hospedagem |
| [Supabase](https://supabase.com) | Banco de dados, autenticação, storage |
| [Cloudflare](https://dash.cloudflare.com) | DNS, CDN, segurança |
| [Resend](https://resend.com) | Emails transacionais |
| [Sentry](https://sentry.io) | Monitoramento de erros |
| [GitHub](https://github.com) | Versionamento e CI/CD |

### Tecnologias
- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Backend**: Fastify + Prisma + PostgreSQL
- **Styling**: Tailwind CSS + Radix UI
- **Estado**: TanStack Query + Zustand
- **Monorepo**: Turborepo + pnpm

## Getting Started

### Pré-requisitos
- Node.js 20+
- pnpm 9+
- Docker (para desenvolvimento local)

### Instalação

```bash
# Clonar repositório
git clone https://github.com/[seu-org]/crm-eurovia.git
cd crm-eurovia

# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# Editar arquivos .env com suas credenciais

# Iniciar banco de dados (PostgreSQL via Docker)
docker-compose up -d

# Gerar cliente Prisma
pnpm db:generate

# Popular banco com dados iniciais
pnpm db:push

# Iniciar desenvolvimento
pnpm dev
```

### Variáveis de Ambiente

#### apps/api/.env
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crm_eurovia
JWT_SECRET=sua-chave-secreta-minimo-32-caracteres
PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001

# Syonet (scraping)
SYONET_URL=https://viasul.syonet.com
SYONET_USERNAME=seu-usuario
SYONET_PASSWORD=sua-senha
```

#### apps/web/.env.local
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-publica
```

## Scripts

```bash
# Desenvolvimento
pnpm dev              # Todos os apps
pnpm --filter @crm/web dev    # Só frontend
pnpm --filter @crm/api dev     # Só backend

# Banco de dados
pnpm db:generate      # Gerar tipos Prisma
pnpm db:push         # Push schema (dev)
pnpm db:migrate      # Migrar (produção)
pnpm db:seed         # Popular com dados iniciais
pnpm db:studio       # Visualizar banco

# Build
pnpm build           # Build todos
pnpm lint            # Lint

# Deploy (Vercel)
vercel               # Preview
vercel --prod        # Produção
```

## Arquitetura

```
crm-eurovia/
├── apps/
│   ├── web/                 # Frontend Next.js
│   │   ├── app/            # App Router
│   │   ├── components/     # Componentes React
│   │   └── lib/            # Utilitários
│   │
│   └── api/                # Backend Fastify
│       ├── prisma/         # Schema e migrations
│       └── src/
│           ├── routes/     # Rotas API
│           ├── services/   # Lógica de negócio
│           └── plugins/    # Plugins Fastify
│
├── packages/
│   └── shared/             # Código compartilhado
│
└── docs/                   # Documentação
```

## Deploy

### Vercel

1. Conectar repositório GitHub ao Vercel
2. Configurar ambientes:
   - Preview: para cada PR
   - Production: branch `main`

3. Variáveis de ambiente (Vercel Dashboard):
   - `DATABASE_URL` (Supabase)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `RESEND_API_KEY`
   - `SENTRY_DSN`

### Cloudflare DNS

```dns
# A record
crm-eurovia.com     A     76.76.21.21 (Vercel)

# CNAME
www                CNAME  cname.vercel-dns.com
```

## Documentação

- [Estratégia de Infraestrutura](docs/STRATEGY.md)
- [Migração para Supabase](docs/SUPABASE_MIGRATION.md)

## Licença

Privado - EUROVIA © 2024-2026

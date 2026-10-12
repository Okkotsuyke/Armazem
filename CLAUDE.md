# CRM EUROVIA - Anthropic Claude Code Instructions

## Visão Geral
CRM para a equipe de vendas da EUROVIA, integrado com Syonet (sistema de gestão da empresa).

## Stack de Infraestrutura

| Serviço | URL/Referência |
|---------|----------------|
| **Vercel** | https://vercel.com |
| **Supabase** | https://supabase.com/dashboard |
| **Cloudflare** | https://dash.cloudflare.com |
| **Resend** | https://resend.com |
| **Sentry** | https://sentry.io |
| **GitHub** | https://github.com |

**Documentação:** [docs/STRATEGY.md](docs/STRATEGY.md)

## Estrutura do Projeto

```
crm-eurovia/
├── apps/
│   ├── web/          # Frontend Next.js 15
│   └── api/          # Backend Fastify + Prisma
├── packages/
│   └── shared/       # Código compartilhado
└── docs/             # Documentação
```

## Comandos Principais

```bash
# Desenvolvimento
pnpm dev              # Iniciar todos os apps
pnpm --filter @crm/web dev   # Só frontend
pnpm --filter @crm/api dev   # Só backend

# Banco de dados
pnpm db:generate      # Gerar tipos Prisma
pnpm db:push          # Push schema (dev)
pnpm db:migrate       # Migrar (produção)
pnpm db:studio        # Visualizar banco

# Build
pnpm build            # Build todos
pnpm --filter @crm/web build  # Build só web
pnpm --filter @crm/api build  # Build só api
```

## Configuração de Serviços

### Supabase
- Schema: PostgreSQL com RLS
- Auth: Supabase Auth (substitui JWT próprio)
- Storage: Para uploads e imagens
- Documentação: [docs/STRATEGY.md](docs/STRATEGY.md)

### Variáveis de Ambiente
Ver `.env.example` nos respectivos apps. NUNCA commitar `.env`.

## Integrações

### Syonet (CRM da empresa)
- URL: https://viasul.syonet.com
- Integração via scraping com Playwright
- Credenciais: Variáveis de ambiente `SYONET_*`

### Resend (Email)
- API Key em `RESEND_API_KEY`
- Domínio emissor configurado em dashboard

### Sentry (Erros)
- DSN público em `NEXT_PUBLIC_SENTRY_DSN`
- Token de auth em `SENTRY_AUTH_TOKEN`

## Deploy

### Vercel
1. Conectar repositório GitHub
2. Configurar environments (preview/production)
3. Deploy automático em push para branches

### Cloudflare (DNS)
- Apontar DNS para Vercel
- Habilitar CDN e WAF
- SSL automático

## Qualidade de Código

- TypeScript strict mode
- ESLint + Prettier
- Zod para validação
- Prisma para тип segurança

## Datas Importantes
- Migração iniciada: 2026-10-12

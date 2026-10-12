# Estratégia de Infraestrutura - CRM EUROVIA

## Stack Alvo

| Serviço | Uso | Status |
|---------|-----|--------|
| **Vercel** | Deploy frontend (Next.js) + Serverless Functions | ✅ A configurar |
| **Supabase** | PostgreSQL + Auth + Storage + Realtime | ✅ A configurar |
| **Cloudflare** | DNS + CDN + WAF + Pages | ✅ A configurar |
| **Resend** | Emails transacionais | ✅ A configurar |
| **Sentry** | Monitoramento de erros | ✅ A configurar |
| **GitHub** | Git + Actions CI/CD | ✅ A configurar |

---

## Arquitetura Proposta

```
┌─────────────────────────────────────────────────────────────────┐
│                         Cloudflare                               │
│   DNS (apex + www) │ CDN/WAF │ Pages (se necessário)          │
└──────────────────────────┬────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │    Vercel   │
                    │             │
                    │  Frontend   │ ← Next.js 15 (apps/web)
                    │  Serverless │ ← API Routes / Edge Functions
                    │             │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼─────┐  ┌──▼──────┐  ┌──▼──────┐
        │  Supabase │  │ Resend  │  │  Sentry │
        │           │  │         │  │         │
        │  Database │  │  Email  │  │ Errors  │
        │  Auth     │  │         │  │         │
        │  Storage  │  │         │  │         │
        └───────────┘  └─────────┘  └─────────┘
```

---

## Plano de Migração

### Fase 1: GitHub + Versionamento
- [ ] Criar repositório GitHub
- [ ] Configurar .gitignore para monorepo
- [ ] Configurar branch protection (main = produção)

### Fase 2: Supabase (Banco + Auth)
- [ ] Criar projeto Supabase
- [ ] Migrar schema Prisma → Supabase
- [ ] Configurar autenticação Supabase (substituir JWT próprio)
- [ ] Configurar RLS (Row Level Security)
- [ ] Migrar dados (se houver)
- [ ] Configurar Storage (uploads, imagens)

### Fase 3: Vercel (Deploy)
- [ ] Criar projeto Vercel
- [ ] Conectar repositório GitHub
- [ ] Configurar ambiente de preview (branch PRs)
- [ ] Configurar ambiente de produção (main)
- [ ] Migrar API Fastify → Next.js API Routes ou manter Fastify
- [ ] Configurar environment variables

### Fase 4: Cloudflare (DNS + CDN)
- [ ] Configurar DNS em Cloudflare
- [ ] Apontar para Vercel
- [ ] Configurar WAF rules
- [ ] Habilitar CDN/Assets
- [ ] Configurar SSL/TLS

### Fase 5: Resend (Email)
- [ ] Criar conta Resend
- [ ] Configurar domínio emissor
- [ ] Integrar com backend
- [ ] Templates de email (welcome, reset password, etc.)

### Fase 6: Sentry (Monitoramento)
- [ ] Criar projeto Sentry
- [ ] Integrar com Next.js
- [ ] Integrar com API (se manter Fastify)
- [ ] Configurar alerts
- [ ] Configurar source maps

### Fase 7: CI/CD
- [ ] GitHub Actions para build/test
- [ ] Deploy automático para preview
- [ ] Deploy manual ou automático para produção
- [ ] Notificações (Slack/Discord)

---

## Environment Variables

### Vercel (Produção)
```env
# Supabase
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Auth (Substitui JWT próprio)
# Usar Supabase Auth (eliminar @fastify/jwt)

# Resend
RESEND_API_KEY=re_...

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=...

# Syonet (mantém scraping)
SYONET_URL=https://viasul.syonet.com
SYONET_USERNAME=...
SYONET_PASSWORD=...
```

---

## Próximos Passos

1. **Criar GitHub repo** (primeira ação)
2. **Commit inicial** com estrutura atual
3. **Criar projeto Supabase** e obter credenciais
4. **Atualizar Prisma schema** para Supabase
5. **Deploy inicial no Vercel**
6. **Testar e iterar**

---

## Links Importantes

- [Vercel Dashboard](https://vercel.com)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Cloudflare Dashboard](https://dash.cloudflare.com)
- [Resend](https://resend.com)
- [Sentry](https://sentry.io)
- [GitHub](https://github.com)

## Data: 2026-10-12

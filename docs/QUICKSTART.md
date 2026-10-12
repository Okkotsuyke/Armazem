# ============================================================
# CRM EUROVIA - Guia de Setup Rápido
# ============================================================

Este guia vai te levar de zero (projeto local) para produção na nova stack.

## Tempo estimado: 2-3 horas

---

## Passo 1: Preparar Projeto

```bash
# No diretório do projeto
cd crm-eurovia

# Executar script de setup
bash scripts/github-setup.sh
```

O script vai:
- Inicializar Git
- Pedir a URL do repositório GitHub
- Criar primeiro commit

---

## Passo 2: Criar Repositório GitHub

1. Acesse https://github.com/new
2. Nome: `crm-eurovia`
3. Privado: Yes
4. NÃO initialize com README (já existe)
5. Create repository

**Depois do script setup:**
```bash
git push -u origin main
git push -u origin develop
```

---

## Passo 3: Criar Projeto Supabase

1. Acesse https://supabase.com/dashboard
2. New Project → crm-eurovia
3. Region: São Paulo (gru)
4. Salve a Database Password

**Anote:**
- Project ID
- Database Password

---

## Passo 4: Configurar Prisma para Supabase

```bash
# Atualizar apps/api/.env
cat > apps/api/.env << EOF
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[SUA_ANON_KEY]"
SUPABASE_SERVICE_ROLE_KEY="[SUA_SERVICE_ROLE_KEY]"
PORT="3001"
NEXT_PUBLIC_API_URL="http://localhost:3001"
EOF

# Gerar cliente Prisma
pnpm db:generate

# Testar conexão e criar banco
pnpm db:push
```

---

## Passo 5: Configurar Vercel

1. Acesse https://vercel.com
2. New Project → Import Git Repository
3. Selecione `crm-eurovia`
4. Framework: Next.js (detectado automaticamente)
5. Root Directory: `.`
6. Build Command: `pnpm build`
7. Environment Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
DATABASE_URL=postgresql://...
RESEND_API_KEY=re_...
NEXT_PUBLIC_SENTRY_DSN=https://...
```

8. Deploy!

---

## Passo 6: Configurar Cloudflare DNS

1. Acesse https://dash.cloudflare.com
2. Adicionar domínio (se não tiver)
3. DNS → Records:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | @ | 76.76.21.21 | DNS only |
| CNAME | www | cname.vercel-dns.com | Proxy |

4. SSL/TLS → Full (strict)
5. Security → WAF (ativa padrões)

---

## Passo 7: Configurar GitHub Secrets

Acesse https://github.com/[user]/crm-eurovia/settings/secrets/actions

**Secrets (não expostos no código):**
- `VERCEL_TOKEN` - Token Vercel
- `DATABASE_URL` - Connection string completa
- `RESEND_API_KEY` - Chave Resend
- `SENTRY_AUTH_TOKEN` - Token Sentry

**Variables (visíveis, valores públicos):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `PRODUCTION_URL` - URL de produção (ex: https://crm-eurovia.com)
- `TURBO_TEAM` - Nome do time Turbo (opcional)

---

## Passo 8: Configurar Sentry

1. Acesse https://sentry.io
2. New Project → Next.js
3. Copie DSN
4. Adicione ao .env

```env
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

## Passo 9: Configurar Resend

1. Acesse https://resend.com
2. API Keys → Create key
3. Domains → Add domain (seu domínio de email)
4. Adicione DNS records no Cloudflare

```env
RESEND_API_KEY=re_xxx
```

---

## Passo 10: Deploy Final

```bash
# Push para main
git checkout main
git merge develop
git push

# Vercel vai fazer deploy automático
# CI/CD vai rodar: lint → test → build → deploy
```

---

## Checklist Final

- [ ] Repositório GitHub criado e pushado
- [ ] Supabase configurado e conectado
- [ ] Vercel deployando
- [ ] Cloudflare DNS propagado
- [ ] CI/CD funcionando (GitHub Actions)
- [ ] Sentry capturando erros
- [ ] Resend enviando emails

---

## Problemas Comuns

### Vercel Build Fail
```bash
# Verificar logs do deploy
vercel logs [deployment-id]
```

### Supabase Connection Error
```bash
# Verificar DATABASE_URL
# Pooler usa porta 6543, não 5432
```

### Prisma Generate Fail
```bash
# Limpar cache
rm -rf node_modules/.prisma
pnpm db:generate
```

---

## Suporte

- GitHub Issues: https://github.com/[user]/crm-eurovia/issues
- Sentry: https://sentry.io/organizations/[org]/issues
- Vercel: https://vercel.com/dashboard

---

**Data: 2026-10-12**

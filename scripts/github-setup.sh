#!/bin/bash
# ============================================================
# CRM EUROVIA - Setup Script
# Execute após criar o repositório GitHub
# ============================================================

set -e

echo "🚀 CRM EUROVIA - Setup Inicial"
echo "================================"

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Git init
echo -e "\n${YELLOW}1. Inicializando Git...${NC}"
if [ ! -d ".git" ]; then
  git init
  echo -e "${GREEN}✓ Git inicializado${NC}"
else
  echo -e "${GREEN}✓ Git já existe${NC}"
fi

# 2. Adicionar remote
echo -e "\n${YELLOW}2. Configurando remote GitHub...${NC}"
read -p "Cole a URL do repositório GitHub (ex: https://github.com/user/crm-eurovia.git): " GITHUB_URL
git remote add origin "$GITHUB_URL"
echo -e "${GREEN}✓ Remote 'origin' configurado${NC}"

# 3. Criar branch inicial
echo -e "\n${YELLOW}3. Configurando branches...${NC}"
git checkout -b develop 2>/dev/null || true
git checkout -b main 2>/dev/null || true
echo -e "${GREEN}✓ Branches configuradas (main, develop)${NC}"

# 4. GitHub secrets (instruções)
echo -e "\n${YELLOW}4. Configurar Secrets no GitHub:${NC}"
echo "   Vá em: https://github.com/[owner]/[repo]/settings/secrets/actions"
echo ""
echo "   Secrets necessários:"
echo "   - DATABASE_URL: Connection string do Supabase"
echo "   - VERCEL_TOKEN: Token Vercel (https://vercel.com/account/tokens)"
echo "   - TURBO_TOKEN: (opcional) Turbo Remote Cache"
echo "   - TURBO_TEAM: (opcional) Nome do time no Turbo"
echo ""
echo "   Variables (no repositório):"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   - PRODUCTION_URL"
echo "   - TURBO_TEAM"

# 5. Primeira mensagem de commit
echo -e "\n${YELLOW}5. Fazendo primeiro commit...${NC}"
git add .
git commit -m "feat: setup inicial do projeto

- Monorepo Turborepo
- Frontend Next.js 15
- Backend Fastify + Prisma
- Configuração de infraestrutura:
  - Vercel (deploy)
  - Supabase (banco + auth)
  - Cloudflare (DNS)
  - Resend (email)
  - Sentry (monitoramento)
  - GitHub Actions (CI/CD)"
echo -e "${GREEN}✓ Commit inicial criado${NC}"

# 6. Instruções finais
echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}Setup concluído!${NC}"
echo ""
echo "Próximos passos:"
echo "1. Push para GitHub:"
echo "   git push -u origin main"
echo "   git push -u origin develop"
echo ""
echo "2. Conectar Vercel:"
echo "   - Acesse https://vercel.com"
echo "   - New Project → Import Git Repository"
echo "   - Configure environments"
echo ""
echo "3. Criar projeto Supabase:"
echo "   - Acesse https://supabase.com"
echo "   - New Project"
echo "   - Configure DATABASE_URL"
echo ""
echo "4. Configurar Cloudflare DNS:"
echo "   - Acesse https://dash.cloudflare.com"
echo "   - Configure DNS para apontar para Vercel"
echo ""
echo -e "${GREEN}================================${NC}"

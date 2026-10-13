# SDD Ledger — plan: .superpowers/plans/implementar-integracoes.md

## Setup
- Plan lido completamente
- Critico: Credenciais expostas + CORS permissivo
- Integrações: Sentry, Resend, Cloudflare
- UI/UX: Dashboard Syonet melhorado

## Tarefas

### Task 1: Corrigir Segurança Crítica
- [x] Remover credenciais hardcoded
- [x] Adicionar validação de env vars
- [x] Corrigir CORS no vercel.json
- [x] Criar .env.example

### Task 2: Backend - Sentry Integration
- [ ] Configurar Sentry SDK
- [ ] Adicionar tracing
- [ ] Capturar erros de scraping

### Task 3: Backend - Resend Integration
- [ ] Configurar Resend SDK
- [ ] Template de email
- [ ] Webhook de notificação

### Task 4: UI/UX - Dashboard Components
- [ ] ConnectionStatus component
- [ ] MetricCard component
- [ ] DateRangeFilter component
- [ ] ProductivityTable component

### Task 5: UI/UX - Dashboard Pages
- [ ] Atualizar página de leads
- [ ] Adicionar gráficos
- [ ] Melhorar UX

## Ledger de Progresso

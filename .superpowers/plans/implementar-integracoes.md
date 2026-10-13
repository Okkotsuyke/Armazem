# Plano: Integrações CRM EUROVIA + Correções Segurança

## Problemas Críticos Identificados
1. **Credenciais expostas** em `validation.routes.ts` (linhas 16-18)
2. **CORS permissivo** no `vercel.json` (`*` para qualquer domínio)
3. **JWT_SECRET sem validação** na inicialização

## Integrações Backend
1. Sentry - Tracking de erros
2. Resend - Emails transacionais  
3. Cloudflare - Workers para API do Syonet

## UI/UX Dashboard
1. Status de conexão em tempo real
2. Cards de métricas interativos
3. Filtros de período visuais
4. Tabela de produtividade melhorada

## Tarefas

### Tarefa 1: Corrigir Segurança Crítica
- Remover credenciais hardcoded do validation.routes.ts
- Adicionar validação de variáveis de ambiente obrigatórias
- Corrigir CORS no vercel.json

### Tarefa 2: Backend - Sentry Integration
- Configurar Sentry SDK
- Adicionar tracing de requests
- Capturar erros de scraping

### Tarefa 3: Backend - Resend Integration
- Configurar Resend SDK
- Criar template de email de validação
- Implementar webhook de notificação

### Tarefa 4: UI/UX - Dashboard Components
- Criar componente ConnectionStatus
- Criar MetricCard com animações
- Criar DateRangeFilter visual
- Criar ProductivityTable melhorada

### Tarefa 5: UI/UX - Dashboard Pages
- Atualizar página de leads com novos componentes
- Adicionar gráficos de produtividade
- Melhorar UX de filtros

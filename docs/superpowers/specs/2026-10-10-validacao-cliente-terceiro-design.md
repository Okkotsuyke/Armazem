# Spec: Dashboard de Validação para Cliente Terceiro

**Data:** 2026-10-10  
**Status:** Aprovado

## Objetivo

Criar um dashboard público/separado para o cliente terceiro da EUROVIA validar se todos os dados (leads, vendas, KPIs) estão corretos após sincronização com o Syonet.

## Escopo

### Funcionalidades
1. **Acesso autenticado** — Cliente terceiro faz login com credenciais próprias
2. **Dashboard de Leads** — Lista de leads com métricas de conversão
3. **Dashboard de Vendas** — Lista de vendas com taxa de conversão
4. **KPIs por dimensão** — Filtravel por loja, mídia e consultor
5. **Detalhamento de registros** — Ver nomes, datas, valores de cada item
6. **Ação de validação** — Cliente confirma "Correto" ou "Reportar Problema"
7. **Relatório consolidado** — Admin vê resultado das validações

### Fora do Escopo
- Exportação de relatórios em PDF/Excel (futuro)
- Integração em tempo real com Syonet (Fase 2)
- Comentários detalhados por item (apenas marcação simples)

## Arquitetura

### Backend
- **apps/api/src/**
  - `routes/validation.ts` — Endpoints de validação
  - `services/validation.ts` — Lógica de validação
  - `plugins/auth.ts` — Middleware para role CLIENT_VALIDATOR

### Frontend
- **apps/web/app/validacao/**
  - `page.tsx` — Dashboard principal de validação
  - `leads/page.tsx` — Lista de leads
  - `vendas/page.tsx` — Lista de vendas
  - `kpis/page.tsx` — KPIs por dimensão
  - `layout.tsx` — Layout com menu lateral

### Banco de Dados (Prisma)
- `ValidationReport` — Armazena validações feitas pelo cliente
  - id, itemType (LEAD|SALE|KPI), itemId, status (CORRETO|INCORRETO), feedback, validatedBy, validatedAt

### Autenticação
- Novo role: `CLIENT_VALIDATOR`
- Novo campo em User: `clientCompany` (nome da empresa do cliente)
- JWT com claims de role

## Fluxo de Dados

```
Syonet → API (sync) → PostgreSQL → Frontend (validacao/) → Cliente Terceiro valida
                                                    ↓
                                    ValidationReport (banco)
                                                    ↓
                                        Admin vê relatório
```

## Componentes UI

1. **Menu lateral** — Navegação entre seções
2. **KPICard** — Exibe métrica + botão validar
3. **DataTable** — Lista de itens com coluna de status
4. **ValidationBadge** — "Validado" / "Pendente" / "Reportado"
5. **ReportModal** — Modal simples para reportar problema

## API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/validation/leads` | Lista leads para validação |
| GET | `/api/v1/validation/sales` | Lista vendas para validação |
| GET | `/api/v1/validation/kpis` | KPIs por dimensão |
| POST | `/api/v1/validation/validate` | Marca item como válido |
| POST | `/api/v1/validation/report` | Reporta problema |
| GET | `/api/v1/validation/summary` | Resumo das validações (admin) |

## Segurança

- Clientes veem apenas dados das lojas que têm permissão
- Rate limiting em endpoints de validação
- Logs de auditoria para todas as ações

## Prioridade de Implementação

1. Schema Prisma + migrations
2. Endpoints API básicos
3. Página de login para cliente
4. Dashboard leads + validação
5. Dashboard vendas + validação
6. Dashboard KPIs + validação
7. Relatório consolidado para admin

# Dashboard de Validação para Cliente Terceiro — Plano de Implementação

> **Sub-skill recomendada:** `superpowers:subagent-driven-development` (implementação task-by-task com revisão)

**Objetivo:** Adicionar funcionalidade de validação ao dashboard do avaliador existente, permitindo que o cliente terceiro marque itens como "Correto" ou "Reportar Problema".

**Arquitetura:** Extensão do dashboard existente `/avaliador/` com新增 validação. Novo modelo `ValidationReport` no banco para armazenar validações. API REST para operações de validação.

**Stack:** Next.js 15, Fastify 4, Prisma 5, TypeScript

**Spec:** `docs/superpowers/specs/2026-10-10-validacao-cliente-terceiro-design.md`

---

## Restrições Globais

- Node.js 20+
- pnpm 9+
- PostgreSQL 16 (via Docker)
- Compatibilidade com schema Prisma existente
- JWT com `type: 'dashboard'` para autenticação do avaliador

---

## Review Focus

1. **Validação duplicada:** Cliente não pode marcar o mesmo item duas vezes (erro 409 Conflict)
2. **Autenticação:** Apenas usuários autenticados como `DashboardUser` podem validar
3. **Permissão de visualização:** Cliente só vê dados que ele tem permissão (lojas específicas)
4. **Integridade dos dados:** Validações são vinculadas a `dashboardUserId`, não ao user system
5. **Feedback vazio:** Quando reportar problema, feedback deve ter pelo menos 3 caracteres

---

## Estrutura de Arquivos

```
apps/api/prisma/schema.prisma          # Adicionar modelo ValidationReport
apps/api/src/routes/
  validation.routes.ts                 # NOVO - Endpoints de validação
apps/api/src/app.ts                   # Registrar rotas de validação
apps/web/app/avaliador/dashboard/
  page.tsx                            # MODIFICAR - Adicionar tabs de validação
  validation-panel.tsx                # NOVO - Componente de painel de validação
```

---

## Tarefas

### Tarefa 1: Schema Prisma — Modelo ValidationReport

**Arquivos:**
- Modificar: `apps/api/prisma/schema.prisma` (linha ~420)

**Interfaces:**
- Consome: modelo existente `DashboardUser`
- Produz: `ValidationReport` com campos: id, itemType, itemId, status, feedback, dashboardUserId, createdAt

- [ ] **Step 1: Adicionar modelo ValidationReport ao schema**

```prisma
// ============================================================
// VALIDATION_REPORTS — Registros de validação do cliente
// ============================================================

enum ValidationStatus {
  CORRETO
  INCORRETO
}

enum ValidationItemType {
  LEAD
  SALE
  APPOINTMENT
  STORE
  VL_CONSULTANT
  MEDIA
  OVERALL
}

model ValidationReport {
  id              String           @id @default(uuid())
  itemType        ValidationItemType @map("item_type")
  itemId          String?         @map("item_id")           // null para validação geral (OVERALL)
  status          ValidationStatus
  feedback        String?                                     // descrição do problema (quando INCORRETO)
  dashboardUserId String           @map("dashboard_user_id")
  dashboardUser   DashboardUser   @relation(fields: [dashboardUserId], references: [id])
  periodStart     DateTime?       @map("period_start")       // período da validação
  periodEnd       DateTime?       @map("period_end")
  createdAt       DateTime        @default(now()) @map("created_at")

  @@unique([itemType, itemId, dashboardUserId, periodStart, periodEnd])
  @@index([itemType])
  @@index([dashboardUserId])
  @@map("validation_reports")
}
```

- [ ] **Step 2: Gerar migration**

Run: `cd apps/api && npx prisma migrate dev --name add_validation_reports`
Expected: Migration criada com sucesso

- [ ] **Step 3: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations/
git commit -m "feat: add ValidationReport model for client validation tracking"
```

---

### Tarefa 2: API — Rotas de Validação

**Arquivos:**
- Criar: `apps/api/src/routes/validation.routes.ts`
- Modificar: `apps/api/src/app.ts` (registrar rotas)

**Interfaces:**
- Consome: JWT com `type: 'dashboard'` do `DashboardUser`
- Produz: Endpoints GET/POST para `/api/v1/dashboard/validation/*`

- [ ] **Step 1: Criar arquivo de rotas de validação**

```typescript
/**
 * Routes: Validation
 * Endpoints para validação de dados pelo cliente terceiro
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';

const ValidationItemSchema = z.object({
  itemType: z.enum(['LEAD', 'SALE', 'APPOINTMENT', 'STORE', 'VL_CONSULTANT', 'MEDIA', 'OVERALL']),
  itemId: z.string().optional(),
  status: z.enum(['CORRETO', 'INCORRETO']),
  feedback: z.string().min(3).optional(),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
});

// Middleware de autenticação para dashboard
async function authenticateDashboard(request: any, reply: any) {
  const token = request.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return reply.status(401).send({ success: false, error: 'Token não fornecido' });
  }

  try {
    const decoded = request.server.jwt.verify(token);
    if (decoded.type !== 'dashboard') {
      return reply.status(401).send({ success: false, error: 'Token inválido para dashboard' });
    }
    request.dashboardUser = decoded;
  } catch {
    return reply.status(401).send({ success: false, error: 'Token inválido ou expirado' });
  }
}

export async function validationRoutes(fastify: FastifyInstance) {
  // Adicionar hook de autenticação
  fastify.addHook('preHandler', authenticateDashboard);

  /**
   * GET /api/v1/dashboard/validation/summary
   * Retorna resumo das validações do cliente
   */
  fastify.get('/summary', async (request, reply) => {
    const { id: userId } = request.dashboardUser;

    const validations = await fastify.prisma.validationReport.findMany({
      where: { dashboardUserId: userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Agrupar por tipo
    const byType = validations.reduce((acc, v) => {
      acc[v.itemType] = acc[v.itemType] || { CORRETO: 0, INCORRETO: 0 };
      acc[v.itemType][v.status]++;
      return acc;
    }, {} as Record<string, Record<string, number>>);

    return {
      success: true,
      data: {
        total: validations.length,
        byType,
        recent: validations.slice(0, 10),
      },
    };
  });

  /**
   * GET /api/v1/dashboard/validation/leads
   * Lista leads para validação
   */
  fastify.get('/leads', async (request, reply) => {
    const { startDate, endDate } = request.query as { startDate?: string; endDate?: string };

    const where: any = {};
    if (startDate) {
      where.receivedAt = { ...where.receivedAt, gte: new Date(startDate) };
    }
    if (endDate) {
      where.receivedAt = { ...where.receivedAt, lte: new Date(endDate + 'T23:59:59Z') };
    }

    const leads = await fastify.prisma.lead.findMany({
      where,
      include: {
        store: true,
        mediaSource: true,
        sale: true,
      },
      orderBy: { receivedAt: 'desc' },
      take: 100,
    });

    // Buscar validações existentes
    const leadIds = leads.map(l => l.id);
    const validations = await fastify.prisma.validationReport.findMany({
      where: {
        dashboardUserId: request.dashboardUser.id,
        itemType: 'LEAD',
        itemId: { in: leadIds },
      },
    });

    const validationMap = new Map(validations.map(v => [v.itemId, v]));

    return {
      success: true,
      data: leads.map(lead => ({
        ...lead,
        validation: validationMap.get(lead.id) || null,
      })),
    };
  });

  /**
   * GET /api/v1/dashboard/validation/sales
   * Lista vendas para validação
   */
  fastify.get('/sales', async (request, reply) => {
    const { startDate, endDate } = request.query as { startDate?: string; endDate?: string };

    const where: any = {};
    if (startDate) {
      where.saleDate = { ...where.saleDate, gte: new Date(startDate) };
    }
    if (endDate) {
      where.saleDate = { ...where.saleDate, lte: new Date(endDate + 'T23:59:59Z') };
    }

    const sales = await fastify.prisma.sale.findMany({
      where,
      include: {
        store: true,
        mediaSource: true,
        vsUser: true,
        vlUser: true,
        lead: true,
      },
      orderBy: { saleDate: 'desc' },
      take: 100,
    });

    const saleIds = sales.map(s => s.id);
    const validations = await fastify.prisma.validationReport.findMany({
      where: {
        dashboardUserId: request.dashboardUser.id,
        itemType: 'SALE',
        itemId: { in: saleIds },
      },
    });

    const validationMap = new Map(validations.map(v => [v.itemId, v]));

    return {
      success: true,
      data: sales.map(sale => ({
        ...sale,
        validation: validationMap.get(sale.id) || null,
      })),
    };
  });

  /**
   * GET /api/v1/dashboard/validation/kpis
   * Lista KPIs para validação
   */
  fastify.get('/kpis', async (request, reply) => {
    // Retorna métricas agregadas por loja
    const stores = await fastify.prisma.store.findMany({
      include: {
        leads: true,
        sales: true,
        appointments: true,
      },
    });

    const kpiData = stores.map(store => {
      const leadsCount = store.leads.length;
      const salesCount = store.sales.length;
      const appointmentsCount = store.appointments.length;
      const conversionRate = leadsCount > 0 ? (salesCount / leadsCount) * 100 : 0;

      return {
        storeId: store.id,
        storeName: store.shortName,
        plaza: store.plaza,
        leadsCount,
        salesCount,
        appointmentsCount,
        conversionRate: Math.round(conversionRate * 100) / 100,
      };
    });

    return {
      success: true,
      data: kpiData,
    };
  });

  /**
   * POST /api/v1/dashboard/validation/validate
   * Marca um item como válido ou inválido
   */
  fastify.post('/validate', async (request, reply) => {
    const body = ValidationItemSchema.parse(request.body);
    const { id: userId } = request.dashboardUser;

    // Validar feedback quando INCORRETO
    if (body.status === 'INCORRETO' && (!body.feedback || body.feedback.length < 3)) {
      return reply.status(400).send({
        success: false,
        error: 'Descrição do problema é obrigatória (mínimo 3 caracteres)',
      });
    }

    // Verificar se já existe validação para este item
    const existing = await fastify.prisma.validationReport.findFirst({
      where: {
        itemType: body.itemType,
        itemId: body.itemId || null,
        dashboardUserId: userId,
        periodStart: body.periodStart ? new Date(body.periodStart) : null,
        periodEnd: body.periodEnd ? new Date(body.periodEnd) : null,
      },
    });

    if (existing) {
      // Atualizar validação existente
      const updated = await fastify.prisma.validationReport.update({
        where: { id: existing.id },
        data: {
          status: body.status,
          feedback: body.feedback || null,
        },
      });

      return {
        success: true,
        data: updated,
        message: 'Validação atualizada com sucesso',
      };
    }

    // Criar nova validação
    const validation = await fastify.prisma.validationReport.create({
      data: {
        itemType: body.itemType,
        itemId: body.itemId || null,
        status: body.status,
        feedback: body.feedback || null,
        dashboardUserId: userId,
        periodStart: body.periodStart ? new Date(body.periodStart) : null,
        periodEnd: body.periodEnd ? new Date(body.periodEnd) : null,
      },
    });

    return {
      success: true,
      data: validation,
      message: 'Validação registrada com sucesso',
    };
  });

  /**
   * DELETE /api/v1/dashboard/validation/:id
   * Remove uma validação
   */
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const { id: userId } = request.dashboardUser;

    const validation = await fastify.prisma.validationReport.findUnique({
      where: { id },
    });

    if (!validation) {
      return reply.status(404).send({ success: false, error: 'Validação não encontrada' });
    }

    if (validation.dashboardUserId !== userId) {
      return reply.status(403).send({ success: false, error: 'Sem permissão para excluir esta validação' });
    }

    await fastify.prisma.validationReport.delete({ where: { id } });

    return {
      success: true,
      message: 'Validação removida com sucesso',
    };
  });
}

export default validationRoutes;
```

- [ ] **Step 2: Registrar rotas no app.ts**

Adicionar no início do arquivo:
```typescript
import { validationRoutes } from './routes/validation.routes';
```

E registrar as rotas:
```typescript
// Validation routes
await app.register(validationRoutes, { prefix: '/api/v1/dashboard/validation' });
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/routes/validation.routes.ts apps/api/src/app.ts
git commit -m "feat: add validation API endpoints for client dashboard"
```

---

### Tarefa 3: Frontend — Painel de Validação

**Arquivos:**
- Criar: `apps/web/app/avaliador/dashboard/validation-panel.tsx`
- Modificar: `apps/web/app/avaliador/dashboard/page.tsx`

**Interfaces:**
- Consome: `GET /api/v1/dashboard/validation/*`, `POST /api/v1/dashboard/validation/validate`
- Produz: Componente React com tabs de validação

- [ ] **Step 1: Criar componente ValidationPanel**

```typescript
'use client';

import { useState, useEffect } from 'react';

interface Validation {
  id: string;
  itemType: string;
  itemId: string | null;
  status: 'CORRETO' | 'INCORRETO';
  feedback: string | null;
  createdAt: string;
}

interface Lead {
  id: string;
  syonetLeadId: string;
  receivedAt: string;
  status: string;
  store: { shortName: string };
  mediaSource: { normalizedName: string } | null;
  validation: Validation | null;
}

interface Sale {
  id: string;
  saleDate: string;
  store: { shortName: string };
  mediaSource: { normalizedName: string } | null;
  amount: string;
  vsUser: { name: string } | null;
  validation: Validation | null;
}

interface KpiData {
  storeId: string;
  storeName: string;
  plaza: string;
  leadsCount: number;
  salesCount: number;
  appointmentsCount: number;
  conversionRate: number;
}

export default function ValidationPanel() {
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'leads' | 'sales' | 'kpis'>('summary');
  const [summary, setSummary] = useState<any>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [kpis, setKpis] = useState<KpiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'month'>('30d');

  // Modal de reportar problema
  const [reportModal, setReportModal] = useState<{ open: boolean; itemType: string; itemId: string } | null>(null);
  const [reportFeedback, setReportFeedback] = useState('');

  useEffect(() => {
    const storedToken = localStorage.getItem('dashboard_token');
    if (!storedToken) {
      window.location.href = '/avaliador/login';
      return;
    }
    setToken(storedToken);
  }, []);

  // Buscar dados
  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      // Calcular datas
      const end = new Date();
      const start = new Date();
      if (dateRange === '7d') start.setDate(start.getDate() - 7);
      else if (dateRange === '30d') start.setDate(start.getDate() - 30);
      else { start.setDate(1); start.setHours(0, 0, 0, 0); }

      const params = `?startDate=${start.toISOString().split('T')[0]}&endDate=${end.toISOString().split('T')[0]}`;

      try {
        if (activeTab === 'summary') {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/dashboard/validation/summary`, { headers });
          const data = await res.json();
          if (data.success) setSummary(data.data);
        } else if (activeTab === 'leads') {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/dashboard/validation/leads${params}`, { headers });
          const data = await res.json();
          if (data.success) setLeads(data.data);
        } else if (activeTab === 'sales') {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/dashboard/validation/sales${params}`, { headers });
          const data = await res.json();
          if (data.success) setSales(data.data);
        } else if (activeTab === 'kpis') {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/dashboard/validation/kpis`, { headers });
          const data = await res.json();
          if (data.success) setKpis(data.data);
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, activeTab, dateRange]);

  const handleValidate = async (itemType: string, itemId: string, status: 'CORRETO' | 'INCORRETO', feedback?: string) => {
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/dashboard/validation/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itemType, itemId, status, feedback }),
      });

      const data = await res.json();
      if (data.success) {
        // Recarregar dados
        setActiveTab(activeTab);
        setReportModal(null);
        setReportFeedback('');
      } else {
        alert(data.error || 'Erro ao validar');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao conectar com o servidor');
    }
  };

  const openReportModal = (itemType: string, itemId: string) => {
    setReportModal({ open: true, itemType, itemId });
    setReportFeedback('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Validação de Dados</h2>
        <div className="flex bg-slate-800 rounded-lg p-1">
          {(['7d', '30d', 'month'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                dateRange === range
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {range === '7d' ? '7 dias' : range === '30d' ? '30 dias' : 'Este mês'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-700">
        {[
          { id: 'summary', label: 'Resumo' },
          { id: 'leads', label: 'Leads' },
          { id: 'sales', label: 'Vendas' },
          { id: 'kpis', label: 'KPIs' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-green-500 text-green-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content - Resumo */}
      {activeTab === 'summary' && summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="text-3xl font-bold text-white">{summary.total}</div>
            <div className="text-sm text-slate-400">Total de Validações</div>
          </div>
          {Object.entries(summary.byType || {}).map(([type, counts]: [string, any]) => (
            <div key={type} className="bg-slate-800 rounded-lg p-4">
              <div className="flex gap-2 items-center mb-2">
                <span className="text-green-400 font-semibold">{counts.CORRETO || 0} ✓</span>
                <span className="text-red-400 font-semibold">{counts.INCORRETO || 0} ✗</span>
              </div>
              <div className="text-sm text-slate-400">{type}</div>
            </div>
          ))}
        </div>
      )}

      {/* Content - Leads */}
      {activeTab === 'leads' && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Lead ID</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Loja</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Mídia</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Data</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Status</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-400">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-mono text-sm">{lead.syonetLeadId}</td>
                  <td className="px-4 py-3">{lead.store?.shortName}</td>
                  <td className="px-4 py-3 text-slate-400">{lead.mediaSource?.normalizedName || '—'}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(lead.receivedAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    {lead.validation ? (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        lead.validation.status === 'CORRETO'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {lead.validation.status}
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-slate-700 text-slate-400">
                        Pendente
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleValidate('LEAD', lead.id, 'CORRETO')}
                        className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                          lead.validation?.status === 'CORRETO'
                            ? 'bg-green-600 text-white'
                            : 'bg-slate-700 hover:bg-green-600 text-slate-300 hover:text-white'
                        }`}
                      >
                        ✓ Correto
                      </button>
                      <button
                        onClick={() => openReportModal('LEAD', lead.id)}
                        className="px-3 py-1 text-xs rounded-lg bg-slate-700 hover:bg-red-600 text-slate-300 hover:text-white transition-colors"
                      >
                        ✗ Reportar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Content - Sales */}
      {activeTab === 'sales' && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Data</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Loja</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Mídia</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Vendedor</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-400">Valor</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-400">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(sale.saleDate).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">{sale.store?.shortName}</td>
                  <td className="px-4 py-3 text-slate-400">{sale.mediaSource?.normalizedName || '—'}</td>
                  <td className="px-4 py-3">{sale.vsUser?.name || '—'}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {sale.amount ? `R$ ${parseFloat(sale.amount).toLocaleString('pt-BR')}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleValidate('SALE', sale.id, 'CORRETO')}
                        className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                          sale.validation?.status === 'CORRETO'
                            ? 'bg-green-600 text-white'
                            : 'bg-slate-700 hover:bg-green-600 text-slate-300 hover:text-white'
                        }`}
                      >
                        ✓ Correto
                      </button>
                      <button
                        onClick={() => openReportModal('SALE', sale.id)}
                        className="px-3 py-1 text-xs rounded-lg bg-slate-700 hover:bg-red-600 text-slate-300 hover:text-white transition-colors"
                      >
                        ✗ Reportar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Content - KPIs */}
      {activeTab === 'kpis' && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Loja</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Praça</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-400">Leads</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-400">Vendas</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-400">Taxa Conv.</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-400">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {kpis.map((kpi) => (
                <tr key={kpi.storeId} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-medium">{kpi.storeName}</td>
                  <td className="px-4 py-3 text-slate-400">{kpi.plaza}</td>
                  <td className="px-4 py-3 text-right font-mono">{kpi.leadsCount}</td>
                  <td className="px-4 py-3 text-right font-mono text-green-400">{kpi.salesCount}</td>
                  <td className="px-4 py-3 text-right font-mono text-blue-400">{kpi.conversionRate}%</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleValidate('STORE', kpi.storeId, 'CORRETO')}
                        className="px-3 py-1 text-xs rounded-lg bg-slate-700 hover:bg-green-600 text-slate-300 hover:text-white transition-colors"
                      >
                        ✓ Correto
                      </button>
                      <button
                        onClick={() => openReportModal('STORE', kpi.storeId)}
                        className="px-3 py-1 text-xs rounded-lg bg-slate-700 hover:bg-red-600 text-slate-300 hover:text-white transition-colors"
                      >
                        ✗ Reportar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Reportar Problema */}
      {reportModal?.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Reportar Problema</h3>
            <textarea
              value={reportFeedback}
              onChange={(e) => setReportFeedback(e.target.value)}
              placeholder="Descreva o problema encontrado..."
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setReportModal(null)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleValidate(reportModal.itemType, reportModal.itemId, 'INCORRETO', reportFeedback)}
                disabled={reportFeedback.length < 3}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Modificar página do dashboard para adicionar tab de validação**

No arquivo `apps/web/app/avaliador/dashboard/page.tsx`, adicionar:

1. Importar o componente:
```typescript
import ValidationPanel from './validation-panel';
```

2. Adicionar novo tab na lista:
```typescript
{ id: 'validation', label: 'Validação' },
```

3. Adicionar renderização do painel:
```typescript
{activeTab === 'validation' && <ValidationPanel />}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/avaliador/dashboard/validation-panel.tsx apps/web/app/avaliador/dashboard/page.tsx
git commit -m "feat: add validation panel to evaluator dashboard"
```

---

## Resumo de Tarefas

| # | Tarefa | Arquivos | Status |
|---|--------|----------|--------|
| 1 | Schema Prisma - ValidationReport | `schema.prisma` | Pendente |
| 2 | API - Rotas de Validação | `validation.routes.ts`, `app.ts` | Pendente |
| 3 | Frontend - Painel de Validação | `validation-panel.tsx`, `page.tsx` | Pendente |

/**
 * Tipos TypeScript para o CRM EUROVIA - Dashboard
 * Tipos fortemente definidos para as APIs do dashboard
 */

// ── Funil de Vendas (TELA 1) ─────────────────────────────────

export interface FunilStoreMetrics {
  storeId: string;
  storeName: string;
  plaza: string | null;
  leads: number;
  appointments: number;
  storeFlow: number;
  sales: number;
  conversionRate: number | null;
  appointmentRate: number | null;
  flowRate: number | null;
  isPlazaRow?: boolean;
  isTotalRow?: boolean;
}

export interface FunilData {
  stores: FunilStoreMetrics[];
  plazas: FunilStoreMetrics[];
  total: FunilStoreMetrics;
}

// ── Produtividade VL (TELA 2) ────────────────────────────────

export interface StatusCounts {
  total: number;
  aguardando: number;
  atrasado: number;
  pendenteDia: number;
  futuro: number;
  prioridade: number;
  trabalhados: number;
}

export interface ProdutividadeVL {
  userId: string;
  userName: string;
  username: string;
  storeName: string | null;
  storeId: string | null;
  statusCounts: StatusCounts;
  appointmentsToday: number;
  confirmedToday: number;
  salesToday: number;
  leadsXVendedorLoja: number;
  leadsXOperadorBdc: number;
  totalWorkedPortfolio: number;
}

// ── Filtros ────────────────────────────────────────────────

export type PeriodFilter = 'today' | 'yesterday' | 'last7days' | 'currentMonth' | 'previousMonth';

export type PlazaFilter = 'ALL' | 'FORTALEZA' | 'SALVADOR';

export interface DashboardFilters {
  period: PeriodFilter;
  plaza: PlazaFilter;
  storeIds?: string[];
  mediaIds?: string[];
}

// ── Resumo do Dashboard ────────────────────────────────────

export interface DashboardSummary {
  leadsReceived: number;
  appointments: number;
  storeFlow: number;
  sales: number;
  conversionLeadSale: number | null;
  conversionLeadAppointment: number | null;
  conversionLeadFlow: number | null;
  lastSyncAt: string | null;
}

// ── Utilitários ────────────────────────────────────────────

export const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'last7days', label: 'Últimos 7 dias' },
  { value: 'currentMonth', label: 'Mês atual' },
  { value: 'previousMonth', label: 'Mês anterior' },
];

export const PLAZA_OPTIONS: { value: PlazaFilter; label: string }[] = [
  { value: 'ALL', label: 'Todas as Praças' },
  { value: 'FORTALEZA', label: 'Fortaleza' },
  { value: 'SALVADOR', label: 'Salvador' },
];

/**
 * Converte o filtro de período para datas de início e fim
 */
export function getPeriodDates(period: PeriodFilter): { startDate: Date; endDate: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  switch (period) {
    case 'today':
      return { startDate: today, endDate: endOfToday };

    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const endYesterday = new Date(yesterday);
      endYesterday.setHours(23, 59, 59, 999);
      return { startDate: yesterday, endDate: endYesterday };
    }

    case 'last7days': {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return { startDate: weekAgo, endDate: endOfToday };
    }

    case 'currentMonth': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: startOfMonth, endDate: endOfToday };
    }

    case 'previousMonth': {
      const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { startDate: startOfPrevMonth, endDate: endOfPrevMonth };
    }

    default:
      return { startDate: today, endDate: endOfToday };
  }
}

/**
 * Formata data para o padrão brasileiro
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formata número para exibição em reais
 */
export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Formata taxa de conversão
 */
export function formatRate(rate: number | null | undefined): string {
  if (rate === null || rate === undefined) return '-';
  return `${rate.toFixed(1)}%`;
}

/**
 * Retorna cor baseada na taxa de conversão
 */
export function getConversionColor(rate: number | null | undefined): string {
  if (rate === null || rate === undefined) return 'text-muted-foreground';
  if (rate >= 20) return 'text-green-600 dark:text-green-400';
  if (rate >= 10) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

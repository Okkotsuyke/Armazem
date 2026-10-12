'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/providers';
import { api } from '@/lib/api';
import { StatCard, Card, LoadingSpinner } from '@/components/dashboard/stats';
import { ConversionFunnel, PieChartComponent, BarChartComponent, MetricsTable } from '@/components/dashboard/charts';
import { FunilTable } from '@/components/dashboard/funil-table';
import { ProdutividadeTable } from '@/components/dashboard/produtividade-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  Calendar,
  TrendingUp,
  DollarSign,
  RefreshCw,
  Building2,
} from 'lucide-react';
import type { FunilStoreMetrics, ProdutividadeVL } from '@/lib/dashboard-types';
import { PERIOD_OPTIONS, PLAZA_OPTIONS, getPeriodDates } from '@/lib/dashboard-types';

export default function DashboardPage() {
  const { accessToken, user } = useAuth();
  const [period, setPeriod] = useState<string>('currentMonth');
  const [plaza, setPlaza] = useState<string>('ALL');

  // Build query params from filters
  const queryParams = useMemo(() => {
    const { startDate, endDate } = getPeriodDates(period as any);
    const params: Record<string, string> = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
    if (plaza !== 'ALL') {
      params.plaza = plaza;
    }
    return params;
  }, [period, plaza]);

  // Overview data
  const { data: overview, isLoading: loadingOverview, refetch: refetchOverview } = useQuery({
    queryKey: ['dashboard', 'overview', queryParams],
    queryFn: () => api.dashboard.overview(accessToken!, queryParams),
    enabled: !!accessToken,
  });

  // By Store / Funil data
  const { data: byStore, isLoading: loadingByStore } = useQuery({
    queryKey: ['dashboard', 'byStore', queryParams],
    queryFn: () => api.dashboard.byStore(accessToken!, queryParams),
    enabled: !!accessToken,
  });

  // By Media data
  const { data: byMedia, isLoading: loadingByMedia } = useQuery({
    queryKey: ['dashboard', 'byMedia', queryParams],
    queryFn: () => api.dashboard.byMedia(accessToken!, queryParams),
    enabled: !!accessToken,
  });

  // By Consultant data
  const { data: byConsultant, isLoading: loadingByConsultant } = useQuery({
    queryKey: ['dashboard', 'byConsultant', queryParams],
    queryFn: () => api.dashboard.byConsultant(accessToken!, queryParams),
    enabled: !!accessToken,
  });

  // Productivity consultants data
  const { data: productivityConsultants, isLoading: loadingProductivity } = useQuery({
    queryKey: ['productivity', 'consultants', queryParams],
    queryFn: () => api.productivity.consultants(accessToken!, {
      ...(plaza !== 'ALL' ? { plaza } : {}),
    }),
    enabled: !!accessToken,
  });

  // Transform data for components
  const overviewData = overview || {
    leadsReceived: 0,
    appointments: 0,
    storeFlow: 0,
    sales: 0,
    conversionLeadSale: null,
    conversionLeadAppointment: null,
    conversionLeadFlow: null,
    lastSyncAt: null,
  };

  // Funil table data - combine stores with plazas and total
  const funilData = useMemo<FunilStoreMetrics[]>(() => {
    if (!byStore) return [];
    const { stores, plazas, total } = byStore;
    // Mark plaza rows and total row
    const plazaRows = plazas.map((p: any) => ({ ...p, isPlazaRow: true }));
    const totalRow = { ...total, isTotalRow: true };
    return [...stores, ...plazaRows, totalRow];
  }, [byStore]);

  // Produtividade table data
  const produtividadeData = useMemo<ProdutividadeVL[]>(() => {
    if (!productivityConsultants) return [];
    return productivityConsultants as ProdutividadeVL[];
  }, [productivityConsultants]);

  // Chart data
  const storeData = byStore?.stores?.slice(0, 10).map((s: any) => ({
    name: s.storeName,
    leads: s.leads,
    appointments: s.appointments,
    flow: s.storeFlow,
    sales: s.sales,
  })) || [];

  const mediaData = byMedia?.slice(0, 8).map((m: any) => ({
    name: m.mediaNormalizedName,
    value: m.leads,
  })) || [];

  const consultantData = byConsultant?.slice(0, 10).map((c: any) => ({
    name: c.userName.split(' ')[0],
    leads: c.leads,
    appointments: c.appointments,
    sales: c.sales,
    rate: c.conversionRate || 0,
  })) || [];

  if (loadingOverview) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do funil de vendas</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={plaza} onValueChange={setPlaza}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Selecione a praça" />
            </SelectTrigger>
            <SelectContent>
              {PLAZA_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            onClick={() => refetchOverview()}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Leads"
          value={overviewData.leadsReceived.toLocaleString('pt-BR')}
          subtitle="Leads no período"
          icon={<Users className="w-6 h-6" />}
          variant="info"
        />
        <StatCard
          title="Agendamentos"
          value={overviewData.appointments.toLocaleString('pt-BR')}
          subtitle={`Taxa: ${(overviewData.conversionLeadAppointment || 0).toFixed(1)}%`}
          icon={<Calendar className="w-6 h-6" />}
          variant="warning"
        />
        <StatCard
          title="Comparecidos"
          value={overviewData.storeFlow.toLocaleString('pt-BR')}
          subtitle="Fluxo de loja"
          icon={<TrendingUp className="w-6 h-6" />}
          variant="default"
        />
        <StatCard
          title="Vendas"
          value={overviewData.sales.toLocaleString('pt-BR')}
          subtitle={`Conversão: ${(overviewData.conversionLeadSale || 0).toFixed(1)}%`}
          icon={<DollarSign className="w-6 h-6" />}
          variant="success"
        />
      </div>

      {/* TABELA 1: Funil de Vendas por Loja */}
      <FunilTable data={funilData} isLoading={loadingByStore} />

      {/* Gráficos em linha */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funil de Conversão */}
        <ConversionFunnel
          leads={overviewData.leadsReceived}
          appointments={overviewData.appointments}
          flow={overviewData.storeFlow}
          sales={overviewData.sales}
        />

        {/* Distribuição por Mídia */}
        <PieChartComponent
          data={mediaData}
          title="Leads por Mídia"
          subtitle="Distribuição por fonte"
        />
      </div>

      {/* TABELA 2: Produtividade VL */}
      <ProdutividadeTable data={produtividadeData} isLoading={loadingProductivity} />

      {/* Desempenho por Loja */}
      {storeData.length > 0 && (
        <BarChartComponent
          data={storeData}
          dataKey="leads"
          nameKey="name"
          title="Leads por Loja"
          subtitle="Top 10 lojas"
          color="#3b82f6"
          height={280}
        />
      )}

      {/* Tabela de Desempenho por VL (resumo) */}
      {consultantData.length > 0 && (
        <MetricsTable
          data={consultantData}
          columns={[
            { key: 'name', label: 'Consultor VL' },
            { key: 'leads', label: 'Leads', align: 'right' },
            { key: 'appointments', label: 'Agend.', align: 'right' },
            { key: 'sales', label: 'Vendas', align: 'right' },
            { key: 'rate', label: 'Taxa Conv.', align: 'right' },
          ]}
          title="Desempenho por Consultor VL (período)"
        />
      )}

      {/* Footer com info de sync */}
      <div className="text-center text-xs text-muted-foreground py-4">
        Dados sincronizados com Syonet
        {overviewData.lastSyncAt && (
          <> • Última sync: {new Date(overviewData.lastSyncAt).toLocaleString('pt-BR')}</>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/providers';
import { api } from '@/lib/api';
import { StatCard, LoadingSpinner } from '@/components/dashboard/stats';
import { ProdutividadeTable } from '@/components/dashboard/produtividade-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/dashboard/stats';
import {
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  ArrowUpRight,
  RefreshCw,
  TrendingUp,
  Target,
} from 'lucide-react';
import type { ProdutividadeVL } from '@/lib/dashboard-types';

export default function ProdutividadePage() {
  const { accessToken, user } = useAuth();
  const [storeFilter, setStoreFilter] = useState<string>('all');

  const { data: consultants, isLoading, refetch } = useQuery({
    queryKey: ['productivity', 'consultants', storeFilter],
    queryFn: () => api.productivity.consultants(accessToken!, {
      ...(storeFilter !== 'all' ? { storeId: storeFilter } : {}),
    }),
    enabled: !!accessToken,
  });

  const { data: portfolio } = useQuery({
    queryKey: ['productivity', 'portfolio'],
    queryFn: () => api.productivity.portfolio(accessToken!, {}),
    enabled: !!accessToken,
  });

  // Filter consultants by store if needed
  const consultantsData = (consultants as ProdutividadeVL[]) || [];

  // Dados do portfolio
  const portfolioSummary = portfolio?.summary || {
    total: 0,
    aguardando: 0,
    atrasado: 0,
    pendenteDia: 0,
    futuro: 0,
    prioridade: 0,
    trabalhados: 0,
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Produtividade VL</h1>
          <p className="text-muted-foreground">Acompanhamento de desempenho dos consultores</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={storeFilter} onValueChange={setStoreFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por loja" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as lojas</SelectItem>
              {/* Add store options dynamically if needed */}
            </SelectContent>
          </Select>
          <button
            onClick={() => refetch()}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPIs de Portfolio (se for VL) */}
      {portfolio && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <StatCard
            title="Total Leads"
            value={portfolioSummary.total}
            icon={<Users className="w-5 h-5" />}
            variant="default"
          />
          <StatCard
            title="Aguardando"
            value={portfolioSummary.aguardando}
            icon={<Clock className="w-5 h-5" />}
            variant="warning"
          />
          <StatCard
            title="Atrasados"
            value={portfolioSummary.atrasado}
            icon={<AlertTriangle className="w-5 h-5" />}
            variant="danger"
          />
          <StatCard
            title="Pendente Hoje"
            value={portfolioSummary.pendenteDia}
            icon={<Target className="w-5 h-5" />}
            variant="info"
          />
          <StatCard
            title="Futuros"
            value={portfolioSummary.futuro}
            icon={<Calendar className="w-5 h-5" />}
            variant="default"
          />
          <StatCard
            title="Prioritários"
            value={portfolioSummary.prioridade}
            icon={<ArrowUpRight className="w-5 h-5" />}
            variant="danger"
          />
          <StatCard
            title="Trabalhados"
            value={portfolioSummary.trabalhados}
            icon={<CheckCircle className="w-5 h-5" />}
            variant="success"
          />
        </div>
      )}

      {/* Tabela de Produtividade */}
      <ProdutividadeTable data={consultantsData} isLoading={isLoading} showDetails={true} />
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn, getDateRangeFromQuickPeriod, toAPIDateString } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, Filter, CalendarDays } from 'lucide-react';
import { useAuth } from '@/app/providers';

type FiltersBarProps = {
  onFiltersChange: (filters: DashboardFiltersState) => void;
  onRefresh: () => void;
  loading?: boolean;
  stores: Array<{ id: string; shortName: string; plaza: string }>;
  vlUsers: Array<{ id: string; name: string }>;
  vsUsers: Array<{ id: string; name: string }>;
};

export type DashboardFiltersState = {
  startDate: string;
  endDate: string;
  quickPeriod: string;
  granularity: string;
  plaza: string;
  storeIds: string[];
  vlUserIds: string[];
  vsUserIds: string[];
  eventTypes: string[];
};

const QUICK_PERIODS = [
  { label: 'Hoje', value: 'today' },
  { label: 'Ontem', value: 'yesterday' },
  { label: 'Últimos 7 dias', value: 'last7days' },
  { label: 'Mês atual', value: 'currentMonth' },
  { label: 'Mês anterior', value: 'previousMonth' },
  { label: 'Personalizado', value: 'custom' },
];

const GRANULARITIES = [
  { label: 'Dia', value: 'day' },
  { label: 'Mês', value: 'month' },
  { label: 'Ano', value: 'year' },
];

const PLAZAS = [
  { label: 'Todas as praças', value: 'ALL' },
  { label: 'Fortaleza', value: 'FORTALEZA' },
  { label: 'Salvador', value: 'SALVADOR' },
];

const EVENT_TYPES = [
  { label: 'SEMINOVOS WEB', value: 'SEMINOVOS WEB' },
  { label: 'SEMINOVOS WEB FACEBOOK', value: 'SEMINOVOS WEB FACEBOOK' },
];

export function FiltersBar({
  onFiltersChange,
  onRefresh,
  loading,
  stores,
  vlUsers,
  vsUsers,
}: FiltersBarProps) {
  const [quickPeriod, setQuickPeriod] = useState('currentMonth');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [granularity, setGranularity] = useState('day');
  const [plaza, setPlaza] = useState('ALL');
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [selectedVl, setSelectedVl] = useState<string[]>([]);
  const [selectedVs, setSelectedVs] = useState<string[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const applyFilters = useCallback(() => {
    let start: Date;
    let end: Date;

    if (quickPeriod === 'custom' && customStart && customEnd) {
      start = new Date(customStart + 'T00:00:00');
      end = new Date(customEnd + 'T23:59:59');
    } else {
      const range = getDateRangeFromQuickPeriod(quickPeriod as any);
      start = range.start;
      end = range.end;
    }

    onFiltersChange({
      startDate: toAPIDateString(start),
      endDate: toAPIDateString(end),
      quickPeriod,
      granularity,
      plaza,
      storeIds: selectedStores,
      vlUserIds: selectedVl,
      vsUserIds: selectedVs,
      eventTypes: selectedEvents,
    });
  }, [quickPeriod, customStart, customEnd, granularity, plaza, selectedStores, selectedVl, selectedVs, selectedEvents]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const filteredStores = plaza === 'ALL' ? stores : stores.filter(s => s.plaza === plaza);

  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-6">
      {/* Período */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Período:</span>
        </div>

        <Select value={quickPeriod} onValueChange={setQuickPeriod}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {QUICK_PERIODS.map(p => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {quickPeriod === 'custom' && (
          <>
            <input
              type="date"
              className="border border-input rounded-md px-3 py-1.5 text-sm bg-background"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
            />
            <span className="text-muted-foreground">até</span>
            <input
              type="date"
              className="border border-input rounded-md px-3 py-1.5 text-sm bg-background"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
            />
          </>
        )}

        {/* Granularidade */}
        <Select value={granularity} onValueChange={setGranularity}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GRANULARITIES.map(g => (
              <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Praça */}
        <Select value={plaza} onValueChange={v => { setPlaza(v); setSelectedStores([]); }}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PLAZAS.map(p => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Loja */}
        <Select
          value={selectedStores[0] ?? 'all'}
          onValueChange={v => setSelectedStores(v === 'all' ? [] : [v])}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Todas lojas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas lojas</SelectItem>
            {filteredStores.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.shortName}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* VL */}
        {vlUsers.length > 0 && (
          <Select
            value={selectedVl[0] ?? 'all'}
            onValueChange={v => setSelectedVl(v === 'all' ? [] : [v])}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Consultor VL" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos consultores</SelectItem>
              {vlUsers.map(v => (
                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* VS */}
        {vsUsers.length > 0 && (
          <Select
            value={selectedVs[0] ?? 'all'}
            onValueChange={v => setSelectedVs(v === 'all' ? [] : [v])}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Vendedor VS" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos vendedores</SelectItem>
              {vsUsers.map(v => (
                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Tipo de evento */}
        <Select
          value={selectedEvents[0] ?? 'all'}
          onValueChange={v => setSelectedEvents(v === 'all' ? [] : [v])}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Tipo de evento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos eventos</SelectItem>
            {EVENT_TYPES.map(e => (
              <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={cn('w-4 h-4 mr-1', loading && 'animate-spin')} />
            Atualizar
          </Button>
        </div>
      </div>
    </div>
  );
}

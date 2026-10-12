'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/providers';
import { api } from '@/lib/api';
import { Card, StatusBadge, LoadingSpinner } from '@/components/dashboard/stats';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Car,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Calendar }> = {
  SCHEDULED: { label: 'Agendado', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Calendar },
  CONFIRMED: { label: 'Confirmado', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  CANCELLED: { label: 'Cancelado', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: XCircle },
  COMPLETED: { label: 'Concluído', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle },
  NO_SHOW: { label: 'Não Compareceu', color: 'bg-red-100 text-red-800 border-red-200', icon: AlertCircle },
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function getDayName(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { weekday: 'short' });
}

function getDayNumber(dateStr: string) {
  const date = new Date(dateStr);
  return date.getDate();
}

function getStatusFromDate(dateStr: string): 'today' | 'past' | 'future' {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  if (date.getTime() === today.getTime()) return 'today';
  if (date < today) return 'past';
  return 'future';
}

interface AgendaItemProps {
  item: any;
}

function AgendaItem({ item }: AgendaItemProps) {
  const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.SCHEDULED;
  const StatusIcon = statusConfig.icon;
  const dayType = getStatusFromDate(item.appointmentDate);

  return (
    <div className={`p-4 rounded-xl border transition-all hover:shadow-md ${
      dayType === 'today' ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800' :
      dayType === 'past' ? 'bg-muted/50 border-muted' :
      'bg-card border-border'
    }`}>
      <div className="flex items-start gap-4">
        {/* Avatar do Cliente */}
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-semibold text-primary flex-shrink-0">
          {item.leadName?.charAt(0)?.toUpperCase() || '?'}
        </div>

        {/* Info Principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold truncate">{item.leadName}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig.color}`}>
              <StatusIcon className="w-3 h-3 inline mr-1" />
              {statusConfig.label}
            </span>
          </div>

          {/* Detalhes */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(item.appointmentDate)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(item.appointmentDate)}
            </span>
            {item.leadPhone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                {item.leadPhone}
              </span>
            )}
            {item.product && (
              <span className="flex items-center gap-1">
                <Car className="w-3.5 h-3.5" />
                {item.product}
              </span>
            )}
          </div>

          {/* Consultor VL */}
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <User className="w-3 h-3" />
            <span>VL: {item.vlConsultantName}</span>
          </div>
        </div>

        {/* Indicador do Dia */}
        {dayType === 'today' && (
          <div className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs font-semibold">
            HOJE
          </div>
        )}
      </div>
    </div>
  );
}

export default function AgendaPage() {
  const { accessToken, user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [view, setView] = useState<'day' | 'week'>('day');

  const { data: agendaData, isLoading, refetch } = useQuery({
    queryKey: ['productivity', 'todayAgenda', selectedDate],
    queryFn: () => api.productivity.todayAgenda(accessToken!, { date: selectedDate }),
    enabled: !!accessToken,
  });

  const agendaItems = agendaData || [];

  // Agrupar por data
  const groupedByDate = agendaItems.reduce((acc: any, item: any) => {
    const dateKey = item.appointmentDate.split('T')[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {});

  // Estatísticas do dia
  const stats = {
    total: agendaItems.length,
    confirmed: agendaItems.filter((a: any) => a.status === 'CONFIRMED').length,
    scheduled: agendaItems.filter((a: any) => a.status === 'SCHEDULED').length,
    completed: agendaItems.filter((a: any) => a.status === 'COMPLETED').length,
    noShow: agendaItems.filter((a: any) => a.status === 'NO_SHOW').length,
    cancelled: agendaItems.filter((a: any) => a.status === 'CANCELLED').length,
  };

  // Navegação de datas
  const navigateDate = (direction: 'prev' | 'next') => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-muted-foreground">Visualização dos agendamentos</p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Seletor de Data */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <p className="text-lg font-semibold">{formatDate(selectedDate)}</p>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1 text-sm text-muted-foreground border rounded px-2 py-1"
              />
            </div>
            <button
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <Button
            variant="outline"
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
          >
            Hoje
          </Button>
        </div>
      </Card>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="text-center py-4">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </Card>
        <Card className="text-center py-4 border-green-200 bg-green-50 dark:bg-green-950/30">
          <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
          <p className="text-xs text-muted-foreground">Confirmados</p>
        </Card>
        <Card className="text-center py-4 border-blue-200 bg-blue-50 dark:bg-blue-950/30">
          <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
          <p className="text-xs text-muted-foreground">Agendados</p>
        </Card>
        <Card className="text-center py-4 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30">
          <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
          <p className="text-xs text-muted-foreground">Concluídos</p>
        </Card>
        <Card className="text-center py-4 border-red-200 bg-red-50 dark:bg-red-950/30">
          <p className="text-2xl font-bold text-red-600">{stats.noShow}</p>
          <p className="text-xs text-muted-foreground">Não Compareceu</p>
        </Card>
      </div>

      {/* Lista de Agendamentos */}
      <Card title="Agendamentos do Dia" subtitle={`${stats.total} agendamentos`}>
        {agendaItems.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum agendamento para esta data</p>
          </div>
        ) : (
          <div className="space-y-3">
            {agendaItems
              .sort((a: any, b: any) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())
              .map((item: any, index: number) => (
                <AgendaItem key={item.id || index} item={item} />
              ))}
          </div>
        )}
      </Card>

      {/* Legenda */}
      <Card>
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          {Object.entries(STATUS_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <div key={key} className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
                  <Icon className="w-3 h-3 inline mr-1" />
                  {config.label}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

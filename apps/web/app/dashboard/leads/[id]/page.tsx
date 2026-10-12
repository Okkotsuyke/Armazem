'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/providers';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  Building,
  Clock,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';

const STATUS_COLORS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  AGUARDANDO: 'warning',
  ATRASADO: 'danger',
  PENDENTE_DIA: 'info',
  FUTURO: 'default',
  ENCAMINHADO: 'success',
  VENDIDO: 'success',
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  const leadId = params.id as string;

  const [newEventType, setNewEventType] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');

  const { data: lead, isLoading, error } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: () => api.leads.get(accessToken!, leadId),
    enabled: !!accessToken && !!leadId,
  }) as any;

  const addEventMutation = useMutation({
    mutationFn: ({ eventType, description }: { eventType: string; description?: string }) =>
      api.leads.addEvent(accessToken!, leadId, eventType, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      setNewEventType('');
      setNewEventDesc('');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Lead não encontrado</h2>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  const eventTypes = [
    { value: 'CONTACTED', label: 'Contato realizado' },
    { value: 'APPOINTMENT', label: 'Agendamento criado' },
    { value: 'FLOW', label: 'Cliente compareceu' },
    { value: 'NEGOTIATION', label: 'Em negociação' },
    { value: 'SALE', label: 'Venda realizada' },
    { value: 'LOST', label: 'Lead perdido' },
    { value: 'NOTE', label: 'Observação' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Lead #{lead.syonetLeadId}</h1>
            <p className="text-muted-foreground text-sm">
              Recebido em {formatDateTime(lead.receivedAt)}
            </p>
          </div>
        </div>
        <Badge
          variant={STATUS_COLORS[lead.statusNormalized || 'AGUARDANDO'] || 'default'}
          className="text-sm px-3 py-1"
        >
          {lead.statusNormalized || lead.status}
        </Badge>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Loja"
          value={lead.store?.shortName || '—'}
          icon={Building}
          subtitle={lead.store?.plaza}
        />
        <KpiCard
          title="Mídia"
          value={lead.mediaSource?.normalizedName || lead.mediaRaw || '—'}
          icon={TrendingUp}
        />
        <KpiCard
          title="Consultor VL"
          value={lead.assignedVl?.name || '—'}
          icon={User}
          subtitle={lead.assignedVl?.username}
        />
        <KpiCard
          title="Vendedor VS"
          value={lead.assignedVs?.name || '—'}
          icon={User}
          subtitle={lead.assignedVs?.username}
        />
      </div>

      {/* Details & History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="border rounded-xl p-6 space-y-4">
            <h3 className="font-semibold">Informações</h3>
            <div className="space-y-3">
              {lead.department && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Depto:</span>
                  <span>{lead.department}</span>
                </div>
              )}
              {lead.tipoVenda && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Tipo Venda:</span>
                  <span>{lead.tipoVenda}</span>
                </div>
              )}
              {lead.eventType && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Evento:</span>
                  <span>{lead.eventType}</span>
                </div>
              )}
              {lead.priorityFlag && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Prioritário</span>
                </div>
              )}
            </div>
          </div>

          {/* Add Event */}
          <div className="border rounded-xl p-6 space-y-4">
            <h3 className="font-semibold">Adicionar Evento</h3>
            <select
              value={newEventType}
              onChange={(e) => setNewEventType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Selecione...</option>
              {eventTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <textarea
              value={newEventDesc}
              onChange={(e) => setNewEventDesc(e.target.value)}
              placeholder="Descrição opcional..."
              className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
              rows={3}
            />
            <Button
              onClick={() => addEventMutation.mutate({ eventType: newEventType, description: newEventDesc })}
              disabled={!newEventType || addEventMutation.isPending}
              className="w-full"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {addEventMutation.isPending ? 'Salvando...' : 'Registrar Evento'}
            </Button>
          </div>
        </div>

        {/* History */}
        <div className="lg:col-span-2">
          <div className="border rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b bg-muted/30">
              <h3 className="font-semibold">Histórico de Eventos</h3>
            </div>
            <div className="divide-y">
              {lead.leadEvents && lead.leadEvents.length > 0 ? (
                lead.leadEvents.map((event: any) => (
                  <div key={event.id} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{event.eventType}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {event.user?.name || 'Sistema'}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(event.eventDate)}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center text-muted-foreground">
                  Nenhum evento registrado
                </div>
              )}
            </div>
          </div>

          {/* Appointments */}
          {lead.appointments && lead.appointments.length > 0 && (
            <div className="border rounded-xl overflow-hidden mt-6">
              <div className="px-6 py-4 border-b bg-muted/30">
                <h3 className="font-semibold">Agendamentos</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Confirmado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lead.appointments.map((apt: any) => (
                    <TableRow key={apt.id}>
                      <TableCell>{formatDateTime(apt.appointmentDate)}</TableCell>
                      <TableCell>
                        <Badge variant={apt.status === 'COMPLETED' ? 'success' : 'outline'}>
                          {apt.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{apt.confirmedFlag ? 'Sim' : 'Não'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Sale */}
          {lead.sale && (
            <div className="border rounded-xl p-6 mt-6 bg-green-50 dark:bg-green-950/20">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-4">
                <CheckCircle className="w-5 h-5" />
                <h3 className="font-semibold">Venda Registrada</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Data:</span>
                  <span className="ml-2">{formatDateTime(lead.sale.saleDate)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="ml-2">{lead.sale.tipoVenda}</span>
                </div>
                {lead.sale.vsUser && (
                  <div>
                    <span className="text-muted-foreground">Vendedor VS:</span>
                    <span className="ml-2">{lead.sale.vsUser.name}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

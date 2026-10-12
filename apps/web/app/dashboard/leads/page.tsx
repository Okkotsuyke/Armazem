'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/providers';
import { api } from '@/lib/api';
import { Card, StatusBadge, LoadingSpinner, StatCard } from '@/components/dashboard/stats';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  Car,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';

const STATUS_COLORS: Record<string, { variant: 'default' | 'success' | 'warning' | 'danger' | 'info'; label: string }> = {
  AGUARDANDO: { variant: 'warning', label: 'Aguardando' },
  ATRASADO: { variant: 'danger', label: 'Atrasado' },
  PENDENTE_DIA: { variant: 'info', label: 'Pendente' },
  FUTURO: { variant: 'default', label: 'Futuro' },
  ENCAMINHADO: { variant: 'info', label: 'Encaminhado' },
  VENDIDO: { variant: 'success', label: 'Vendido' },
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function formatPhone(phone: string | null) {
  if (!phone) return '—';
  return phone;
}

interface LeadRowProps {
  lead: any;
  onView?: (lead: any) => void;
}

function LeadRow({ lead, onView }: LeadRowProps) {
  const statusConfig = STATUS_COLORS[lead.statusNormalized] || STATUS_COLORS.AGUARDANDO;

  return (
    <TableRow className="hover:bg-muted/50 cursor-pointer" onClick={() => onView?.(lead)}>
      <TableCell className="font-medium">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
            {lead.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-medium">{lead.name}</p>
            {lead.email && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {lead.email}
              </p>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge status={statusConfig.label} variant={statusConfig.variant} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 text-sm">
          <Phone className="w-3.5 h-3.5 text-muted-foreground" />
          <span>{formatPhone(lead.phone)}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <p>{lead.vehicleModel || '—'}</p>
          {lead.vehicleYear && <p className="text-xs text-muted-foreground">{lead.vehicleYear}</p>}
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <p className="font-medium">{lead.vlConsultantName || '—'}</p>
          {lead.storeName && <p className="text-xs text-muted-foreground">{lead.storeName}</p>}
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <p className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            {formatDate(lead.createdAt)}
          </p>
          {lead.lastContactAt && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" />
              {formatDate(lead.lastContactAt)}
            </p>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <p>{lead.mediaSource || '—'}</p>
          {lead.mediaCategory && (
            <p className="text-xs text-muted-foreground">{lead.mediaCategory}</p>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Button variant="ghost" size="sm">
          <Eye className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default function LeadsPage() {
  const { accessToken, user } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: portfolio, isLoading, refetch } = useQuery({
    queryKey: ['productivity', 'portfolio', page, statusFilter],
    queryFn: () => api.productivity.portfolio(accessToken!, {
      status: statusFilter !== 'all' ? statusFilter as any : undefined,
    }),
    enabled: !!accessToken,
  });

  const leads = portfolio?.leads || [];
  const summary: any = portfolio?.summary || {};

  // Filtrar localmente pela busca
  const filteredLeads = leads.filter((lead: any) => {
    const searchLower = search.toLowerCase();
    return (
      lead.name?.toLowerCase().includes(searchLower) ||
      lead.phone?.includes(search) ||
      lead.email?.toLowerCase().includes(searchLower) ||
      lead.vlConsultantName?.toLowerCase().includes(searchLower)
    );
  });

  // Estatísticas
  const stats = [
    { label: 'Total', value: summary.total || 0, color: 'text-foreground' },
    { label: 'Aguardando', value: summary.aguardando || 0, color: 'text-yellow-600' },
    { label: 'Atrasados', value: summary.atrasado || 0, color: 'text-red-600' },
    { label: 'Pendentes', value: summary.pendenteDia || 0, color: 'text-blue-600' },
    { label: 'Futuros', value: summary.futuro || 0, color: 'text-purple-600' },
    { label: 'Trabalhados', value: summary.trabalhados || 0, color: 'text-green-600' },
  ];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-muted-foreground">Gestão e acompanhamento de leads</p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="text-center py-4">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, telefone, e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              {Object.entries(STATUS_COLORS).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tabela de Leads */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Veículo</TableHead>
              <TableHead>VL Consultor</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead>Mídia</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {search ? 'Nenhum lead encontrado para a busca' : 'Nenhum lead no período'}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead: any) => (
                <LeadRow key={lead.id} lead={lead} />
              ))
            )}
          </TableBody>
        </Table>

        {/* Paginação */}
        {filteredLeads.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              Mostrando {filteredLeads.length} leads
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
              <span className="text-sm px-3">Página {page}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={filteredLeads.length < pageSize}
              >
                Próxima
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Legenda de Status */}
      <Card>
        <p className="text-sm font-medium mb-3">Legenda de Status</p>
        <div className="flex flex-wrap gap-4">
          {Object.entries(STATUS_COLORS).map(([key, config]) => (
            <StatusBadge key={key} status={config.label} variant={config.variant} />
          ))}
        </div>
      </Card>
    </div>
  );
}

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
  const [summary, setSummary] = useState<{ total: number; byType: Record<string, { CORRETO: number; INCORRETO: number }> } | null>(null);
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

      // Calcular datas baseadas no filtro
      const end = new Date();
      end.setHours(23, 59, 59, 999);

      const start = new Date();
      if (dateRange === '7d') {
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
      } else if (dateRange === '30d') {
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
      } else if (dateRange === 'month') {
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
      }

      const params = `?startDate=${start.toISOString().split('T')[0]}&endDate=${end.toISOString().split('T')[0]}`;

      try {
        if (activeTab === 'summary') {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/dashboard/validation/summary${params}`, { headers });
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
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/dashboard/validation/kpis${params}`, { headers });
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
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
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
                  ? 'bg-green-600 text-white'
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
          {Object.entries(summary.byType || {}).map(([type, counts], idx) => (
            <div key={`type-${type}-${idx}`} className="bg-slate-800 rounded-lg p-4">
              <div className="flex gap-2 items-center mb-2">
                <span className="text-green-400 font-semibold">{(counts as any).CORRETO || 0} ✓</span>
                <span className="text-red-400 font-semibold">{(counts as any).INCORRETO || 0} ✗</span>
              </div>
              <div className="text-sm text-slate-400">{type}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'summary' && summary && summary.total === 0 && (
        <div className="bg-slate-800/50 rounded-lg p-8 text-center">
          <div className="text-slate-400 mb-2">Nenhuma validação realizada ainda</div>
          <div className="text-sm text-slate-500">Use as abas acima para validar leads, vendas ou KPIs</div>
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
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Nenhum lead encontrado no período
                  </td>
                </tr>
              ) : (
                leads.map((lead, idx) => (
                  <tr key={`lead-${lead.id}-${idx}`} className="hover:bg-slate-800/30">
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
                ))
              )}
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
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Nenhuma venda encontrada no período
                  </td>
                </tr>
              ) : (
                sales.map((sale, idx) => (
                  <tr key={`sale-${sale.id}-${idx}`} className="hover:bg-slate-800/30">
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
                ))
              )}
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
              {kpis.map((kpi, idx) => (
                <tr key={`kpi-${kpi.storeId}-${idx}`} className="hover:bg-slate-800/30">
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

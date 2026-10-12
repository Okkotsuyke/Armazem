'use client';

import { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, StatusBadge } from '@/components/dashboard/stats';
import { cn } from '@/lib/utils';

interface ProdutividadeRow {
  userId: string;
  userName: string;
  username: string;
  storeName: string | null;
  storeId: string | null;
  statusCounts: {
    total: number;
    aguardando: number;
    atrasado: number;
    pendenteDia: number;
    futuro: number;
    prioridade: number;
    trabalhados: number;
  };
  appointmentsToday: number;
  confirmedToday: number;
  salesToday: number;
}

interface ProdutividadeTableProps {
  data: ProdutividadeRow[];
  isLoading?: boolean;
  showDetails?: boolean;
}

function formatRate(sales: number, total: number): string {
  if (total === 0) return '-';
  const rate = (sales / total) * 100;
  return `${rate.toFixed(1)}%`;
}

function getConversionColor(rate: number | null | undefined): string {
  if (rate === null || rate === undefined) return 'text-muted-foreground';
  if (rate >= 30) return 'text-green-600 dark:text-green-400 font-semibold';
  if (rate >= 15) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-muted-foreground';
}

export function ProdutividadeTable({ data, isLoading, showDetails = true }: ProdutividadeTableProps) {
  const rows = useMemo(() => {
    if (!data?.length) return [];
    return [...data].sort((a, b) => {
      // Sort by sales descending
      return b.salesToday - a.salesToday;
    });
  }, [data]);

  const totals = useMemo(() => {
    if (!rows.length) return null;
    return rows.reduce(
      (acc, row) => ({
        total: acc.total + row.statusCounts.total,
        aguardando: acc.aguardando + row.statusCounts.aguardando,
        atrasado: acc.atrasado + row.statusCounts.atrasado,
        pendenteDia: acc.pendenteDia + row.statusCounts.pendenteDia,
        futuro: acc.futuro + row.statusCounts.futuro,
        prioridade: acc.prioridade + row.statusCounts.prioridade,
        trabalhados: acc.trabalhados + row.statusCounts.trabalhados,
        appointmentsToday: acc.appointmentsToday + row.appointmentsToday,
        confirmedToday: acc.confirmedToday + row.confirmedToday,
        salesToday: acc.salesToday + row.salesToday,
      }),
      {
        total: 0,
        aguardando: 0,
        atrasado: 0,
        pendenteDia: 0,
        futuro: 0,
        prioridade: 0,
        trabalhados: 0,
        appointmentsToday: 0,
        confirmedToday: 0,
        salesToday: 0,
      },
    );
  }, [rows]);

  if (isLoading) {
    return (
      <Card title="Produtividade por VL" subtitle="Desempenho dos consultores">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex gap-4">
              <div className="h-10 bg-muted rounded flex-1" />
              <div className="h-10 bg-muted rounded w-20" />
              <div className="h-10 bg-muted rounded w-20" />
              <div className="h-10 bg-muted rounded w-20" />
              <div className="h-10 bg-muted rounded w-20" />
              <div className="h-10 bg-muted rounded w-20" />
              <div className="h-10 bg-muted rounded w-20" />
              <div className="h-10 bg-muted rounded w-20" />
              <div className="h-10 bg-muted rounded w-20" />
              <div className="h-10 bg-muted rounded w-20" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!rows.length) {
    return (
      <Card title="Produtividade por VL" subtitle="Desempenho dos consultores">
        <div className="text-center py-8 text-muted-foreground">
          Nenhum dado disponível para o período selecionado.
        </div>
      </Card>
    );
  }

  return (
    <Card title="Produtividade por VL" subtitle="Desempenho dos consultores no dia">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="sticky left-0 bg-muted/50 min-w-[160px]">VL (Nome)</TableHead>
              <TableHead className="min-w-[120px]">Loja</TableHead>
              <TableHead className="text-right min-w-[90px]">Carteira Total</TableHead>
              {showDetails && (
                <>
                  <TableHead className="text-right min-w-[90px]">Aguardando</TableHead>
                  <TableHead className="text-right min-w-[90px]">Atrasados</TableHead>
                  <TableHead className="text-right min-w-[90px]">Pendentes</TableHead>
                </>
              )}
              <TableHead className="text-right min-w-[90px]">Agendados</TableHead>
              <TableHead className="text-right min-w-[90px]">Comparecidos</TableHead>
              <TableHead className="text-right min-w-[80px]">Vendas</TableHead>
              <TableHead className="text-right min-w-[90px]">Conversão (%)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const conversionRate =
                row.statusCounts.total > 0
                  ? (row.salesToday / row.statusCounts.total) * 100
                  : null;

              return (
                <TableRow key={row.userId} className="hover:bg-muted/30">
                  <TableCell className="sticky left-0 bg-background">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                        {row.userName.charAt(0)}
                      </div>
                      <span className="font-medium">{row.userName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.storeName ?? '-'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {row.statusCounts.total.toLocaleString('pt-BR')}
                  </TableCell>
                  {showDetails && (
                    <>
                      <TableCell className="text-right">
                        {row.statusCounts.aguardando > 0 ? (
                          <span className="inline-flex items-center justify-center min-w-[28px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium dark:bg-yellow-900/50 dark:text-yellow-400">
                            {row.statusCounts.aguardando}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.statusCounts.atrasado > 0 ? (
                          <span className="inline-flex items-center justify-center min-w-[28px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-medium dark:bg-red-900/50 dark:text-red-400">
                            {row.statusCounts.atrasado}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.statusCounts.pendenteDia > 0 ? (
                          <span className="inline-flex items-center justify-center min-w-[28px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-medium dark:bg-blue-900/50 dark:text-blue-400">
                            {row.statusCounts.pendenteDia}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                    </>
                  )}
                  <TableCell className="text-right">
                    {row.appointmentsToday.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.confirmedToday.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-green-600 dark:text-green-400">
                    {row.salesToday.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className={cn('text-right', getConversionColor(conversionRate))}>
                    {formatRate(row.salesToday, row.statusCounts.total)}
                  </TableCell>
                </TableRow>
              );
            })}

            {/* Totals row */}
            {totals && (
              <TableRow className="bg-primary/5 font-bold border-t-2 border-primary/20">
                <TableCell className="sticky left-0 bg-primary/5">
                  TOTAL
                </TableCell>
                <TableCell>-</TableCell>
                <TableCell className="text-right">
                  {totals.total.toLocaleString('pt-BR')}
                </TableCell>
                {showDetails && (
                  <>
                    <TableCell className="text-right">
                      {totals.aguardando.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      {totals.atrasado.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      {totals.pendenteDia.toLocaleString('pt-BR')}
                    </TableCell>
                  </>
                )}
                <TableCell className="text-right">
                  {totals.appointmentsToday.toLocaleString('pt-BR')}
                </TableCell>
                <TableCell className="text-right">
                  {totals.confirmedToday.toLocaleString('pt-BR')}
                </TableCell>
                <TableCell className="text-right text-green-600 dark:text-green-400">
                  {totals.salesToday.toLocaleString('pt-BR')}
                </TableCell>
                <TableCell className={cn('text-right', getConversionColor(
                  totals.total > 0 ? (totals.salesToday / totals.total) * 100 : null
                ))}>
                  {formatRate(totals.salesToday, totals.total)}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

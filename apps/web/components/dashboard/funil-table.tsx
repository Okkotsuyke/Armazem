'use client';

import { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/dashboard/stats';
import { cn } from '@/lib/utils';

interface FunilRow {
  storeId: string;
  storeName: string;
  plaza: string | null;
  leads: number;
  appointments: number;
  storeFlow: number;
  sales: number;
  conversionRate: number | null;
  isPlazaRow?: boolean;
  isTotalRow?: boolean;
  vendedores?: string[];
}

interface FunilTableProps {
  data: FunilRow[];
  isLoading?: boolean;
}

function formatRate(rate: number | null | undefined): string {
  if (rate === null || rate === undefined) return '-';
  return `${rate.toFixed(1)}%`;
}

function getConversionColor(rate: number | null | undefined): string {
  if (rate === null || rate === undefined) return 'text-muted-foreground';
  if (rate >= 20) return 'text-green-600 dark:text-green-400 font-semibold';
  if (rate >= 10) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

export function FunilTable({ data, isLoading }: FunilTableProps) {
  const rows = useMemo(() => {
    if (!data?.length) return [];

    const storeRows: FunilRow[] = [];
    const summaryRows: FunilRow[] = [];

    data.forEach((row) => {
      if (row.isPlazaRow || row.isTotalRow) {
        summaryRows.push(row);
      } else {
        storeRows.push(row);
      }
    });

    // Sort stores by plaza, then by name
    storeRows.sort((a, b) => {
      if (a.plaza !== b.plaza) {
        return (a.plaza ?? '').localeCompare(b.plaza ?? '');
      }
      return a.storeName.localeCompare(b.storeName);
    });

    return [...storeRows, ...summaryRows];
  }, [data]);

  if (isLoading) {
    return (
      <Card title="Funil de Vendas por Loja" subtitle="Conversão de leads em vendas">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex gap-4">
              <div className="h-10 bg-muted rounded flex-1" />
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
      <Card title="Funil de Vendas por Loja" subtitle="Conversão de leads em vendas">
        <div className="text-center py-8 text-muted-foreground">
          Nenhum dado disponível para o período selecionado.
        </div>
      </Card>
    );
  }

  return (
    <Card title="Funil de Vendas por Loja" subtitle="Conversão de leads em vendas">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="sticky left-0 bg-muted/50 min-w-[180px]">Loja</TableHead>
              <TableHead className="text-right min-w-[100px]">Total Leads</TableHead>
              <TableHead className="text-right min-w-[100px]">Agendados</TableHead>
              <TableHead className="text-right min-w-[100px]">Comparecidos</TableHead>
              <TableHead className="text-right min-w-[100px]">Vendas</TableHead>
              <TableHead className="text-right min-w-[100px]">Conversão (%)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => {
              const isSummary = row.isPlazaRow || row.isTotalRow;
              return (
                <TableRow
                  key={row.storeId ?? `row-${index}`}
                  className={cn(
                    isSummary && 'bg-muted/30 font-medium',
                    row.isTotalRow && 'bg-primary/5 font-bold',
                  )}
                >
                  <TableCell
                    className={cn(
                      'sticky left-0',
                      isSummary ? 'bg-muted/30' : 'bg-background',
                      row.isTotalRow && 'bg-primary/5',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {row.isPlazaRow && (
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {row.plaza}
                        </span>
                      )}
                      <span>{row.storeName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {row.leads.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.appointments.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.storeFlow.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {row.sales.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className={cn('text-right', getConversionColor(row.conversionRate))}>
                    {formatRate(row.conversionRate)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Totais summary */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex flex-wrap gap-6 text-sm">
          {(() => {
            const total = rows.find((r) => r.isTotalRow);
            if (!total) return null;
            return (
              <>
                <div>
                  <span className="text-muted-foreground">Total de Leads: </span>
                  <span className="font-semibold">{total.leads.toLocaleString('pt-BR')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Vendas: </span>
                  <span className="font-semibold">{total.sales.toLocaleString('pt-BR')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Conversão Geral: </span>
                  <span className={cn('font-semibold', getConversionColor(total.conversionRate))}>
                    {formatRate(total.conversionRate)}
                  </span>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </Card>
  );
}

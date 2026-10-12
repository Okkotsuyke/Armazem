import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, startOfMonth, endOfMonth, subDays, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, fmt = 'dd/MM/yyyy') {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt, { locale: ptBR });
}

export function formatDateTime(date: string | Date) {
  return formatDate(date, "dd/MM/yyyy 'às' HH:mm");
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `${value.toFixed(1)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

// Quick period helpers
export function getDateRangeFromQuickPeriod(
  period: 'today' | 'yesterday' | 'last7days' | 'currentMonth' | 'previousMonth',
) {
  const now = new Date();
  switch (period) {
    case 'today':
      return { start: now, end: now };
    case 'yesterday': {
      const d = subDays(now, 1);
      return { start: d, end: d };
    }
    case 'last7days':
      return { start: subDays(now, 7), end: now };
    case 'currentMonth':
      return { start: startOfMonth(now), end: now };
    case 'previousMonth': {
      const prev = subMonths(now, 1);
      return { start: startOfMonth(prev), end: endOfMonth(prev) };
    }
  }
}

export function toISODateString(date: Date) {
  return date.toISOString().split('T')[0];
}

export function toAPIDateString(date: Date) {
  return date.toISOString();
}

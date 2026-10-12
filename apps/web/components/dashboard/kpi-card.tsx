import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

type KpiCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  loading?: boolean;
  tooltip?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
};

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  loading,
  tooltip,
  variant = 'default',
}: KpiCardProps) {
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 animate-pulse">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="h-3 w-24 bg-muted rounded" />
            <div className="h-8 w-16 bg-muted rounded" />
            {subtitle && <div className="h-3 w-20 bg-muted rounded" />}
          </div>
          <div className="w-10 h-10 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  const variantClasses = {
    default: 'bg-card border-border',
    success: 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900',
    warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900',
    danger: 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900',
  };

  const iconVariantClasses = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    danger: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div
      className={cn('rounded-xl border p-5 transition-shadow hover:shadow-sm', variantClasses[variant])}
      title={tooltip}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">
            {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trendValue && (
            <div className="mt-2 flex items-center gap-1 text-xs font-medium">
              {trend === 'up' && <span className="text-green-600">↑ {trendValue}</span>}
              {trend === 'down' && <span className="text-red-600">↓ {trendValue}</span>}
              {trend === 'neutral' && <span className="text-muted-foreground">{trendValue}</span>}
            </div>
          )}
        </div>
        <div className={cn('flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center', iconVariantClasses[variant])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

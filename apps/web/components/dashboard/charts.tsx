'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import { Card } from './stats';

// Cores do tema
const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  success: '#22c55e',
  warning: '#eab308',
  danger: '#ef4444',
  info: '#3b82f6',
  muted: 'hsl(var(--muted-foreground))',
  border: 'hsl(var(--border))',
};

const STATUS_COLORS = {
  AGUARDANDO: '#eab308',
  ATRASADO: '#ef4444',
  PENDENTE_DIA: '#3b82f6',
  FUTURO: '#8b5cf6',
  ENCAMINHADO: '#22c55e',
  VENDIDO: '#10b981',
};

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  formatter?: (value: number) => string;
}

function CustomTooltip({ active, payload, label, formatter }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
      {label && <p className="font-medium mb-2">{label}</p>}
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">{formatter ? formatter(entry.value) : entry.value.toLocaleString('pt-BR')}</span>
        </div>
      ))}
    </div>
  );
}

interface BarChartComponentProps {
  data: Array<Record<string, unknown>>;
  dataKey: string;
  nameKey: string;
  title?: string;
  subtitle?: string;
  color?: string;
  height?: number;
}

export function BarChartComponent({ data, dataKey, nameKey, title, subtitle, color = CHART_COLORS.primary, height = 300 }: BarChartComponentProps) {
  return (
    <Card title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.border} vertical={false} />
          <XAxis
            dataKey={nameKey}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: CHART_COLORS.border }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value.toLocaleString('pt-BR')}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} maxBarSize={60} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

interface PieChartComponentProps {
  data: Array<{ name: string; value: number; color?: string }>;
  title?: string;
  subtitle?: string;
  height?: number;
  showLegend?: boolean;
}

export function PieChartComponent({ data, title, subtitle, height = 300, showLegend = true }: PieChartComponentProps) {
  const COLORS = [CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.danger, CHART_COLORS.info, '#8b5cf6', '#ec4899'];

  return (
    <Card title={title} subtitle={subtitle}>
      <div className="flex items-center gap-8">
        <ResponsiveContainer width="60%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {showLegend && (
          <div className="flex-1 space-y-2">
            {data.map((entry, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color || COLORS[index % COLORS.length] }} />
                  <span className="text-sm">{entry.name}</span>
                </div>
                <span className="text-sm font-medium">{entry.value.toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

interface LineChartComponentProps {
  data: Array<Record<string, unknown>>;
  lines: Array<{ dataKey: string; name: string; color?: string }>;
  title?: string;
  subtitle?: string;
  height?: number;
}

export function LineChartComponent({ data, lines, title, subtitle, height = 300 }: LineChartComponentProps) {
  const COLORS = [CHART_COLORS.info, CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.danger];

  return (
    <Card title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.border} vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: CHART_COLORS.border }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value.toLocaleString('pt-BR')}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {lines.map((line, index) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color || COLORS[index % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 4, fill: line.color || COLORS[index % COLORS.length] }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

interface AreaChartComponentProps {
  data: Array<Record<string, unknown>>;
  dataKey: string;
  nameKey: string;
  title?: string;
  subtitle?: string;
  color?: string;
  height?: number;
}

export function AreaChartComponent({ data, dataKey, nameKey, title, subtitle, color = CHART_COLORS.info, height = 300 }: AreaChartComponentProps) {
  return (
    <Card title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.border} vertical={false} />
          <XAxis
            dataKey={nameKey}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: CHART_COLORS.border }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value.toLocaleString('pt-BR')}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#gradient-${dataKey})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

interface FunnelChartProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
    percentage?: number;
  }>;
  title?: string;
  subtitle?: string;
}

export function FunnelChart({ data, title, subtitle }: FunnelChartProps) {
  const maxValue = data[0]?.value || 1;

  return (
    <Card title={title} subtitle={subtitle}>
      <div className="space-y-4">
        {data.map((item, index) => {
          const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          const colors = [CHART_COLORS.info, CHART_COLORS.success, '#8b5cf6', CHART_COLORS.warning, CHART_COLORS.muted];
          const color = item.color || colors[index % colors.length];

          return (
            <div key={item.name} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{item.name}</span>
                <span className="text-muted-foreground">
                  {item.value.toLocaleString('pt-BR')}
                  {item.percentage !== undefined && (
                    <span className="ml-2 text-xs">({item.percentage.toFixed(1)}%)</span>
                  )}
                </span>
              </div>
              <div className="h-8 bg-secondary rounded-lg overflow-hidden">
                <div
                  className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-3"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: color,
                    minWidth: item.value > 0 ? '40px' : '0',
                  }}
                >
                  {percentage > 15 && (
                    <span className="text-xs font-medium text-white">{percentage.toFixed(0)}%</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

interface ConversionFunnelProps {
  leads: number;
  appointments: number;
  flow: number;
  sales: number;
  title?: string;
}

export function ConversionFunnel({ leads, appointments, flow, sales, title = 'Funil de Conversão' }: ConversionFunnelProps) {
  const data = [
    { name: 'Leads', value: leads, color: CHART_COLORS.info },
    { name: 'Agendamentos', value: appointments, color: CHART_COLORS.warning },
    { name: 'Fluxo', value: flow, color: '#8b5cf6' },
    { name: 'Vendas', value: sales, color: CHART_COLORS.success },
  ];

  return (
    <Card title={title}>
      <div className="space-y-6">
        {data.map((item, index) => {
          const percentage = leads > 0 ? (item.value / leads) * 100 : 0;
          const prevValue = index > 0 ? data[index - 1].value : item.value;
          const dropRate = index > 0 && prevValue > 0 ? ((prevValue - item.value) / prevValue) * 100 : 0;

          return (
            <div key={item.name}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-medium">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold">{item.value.toLocaleString('pt-BR')}</span>
                  <span className="text-sm text-muted-foreground ml-2">({percentage.toFixed(1)}%)</span>
                </div>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
              {dropRate > 0 && index > 0 && (
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  ↓ {dropRate.toFixed(1)}% de perda
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

interface MetricsTableProps {
  data: Array<{
    name: string;
    leads?: number;
    appointments?: number;
    flow?: number;
    sales?: number;
    rate?: number;
    [key: string]: unknown;
  }>;
  columns: Array<{
    key: string;
    label: string;
    align?: 'left' | 'center' | 'right';
  }>;
  title?: string;
}

export function MetricsTable({ data, columns, title }: MetricsTableProps) {
  return (
    <Card title={title}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left py-3 px-4 text-sm font-medium text-muted-foreground"
                  style={{ textAlign: col.align || 'left' }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className="border-b last:border-0 hover:bg-muted/50">
                {columns.map((col) => {
                  const value = (row as any)[col.key];
                  return (
                  <td key={col.key} className="py-3 px-4 text-sm" style={{ textAlign: col.align || 'left' }}>
                    {col.key === 'rate' && value !== undefined ? (
                      <span className={`font-medium ${
                        Number(value) >= 50 ? 'text-green-600' :
                        Number(value) >= 25 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {Number(value).toFixed(1)}%
                      </span>
                    ) : (
                      value?.toLocaleString?.('pt-BR') ?? value ?? '—'
                    )}
                  </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

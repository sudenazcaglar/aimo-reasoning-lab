import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'cyan' | 'violet' | 'green' | 'amber' | 'red' | 'slate';
  sub?: string;
}

const colorMap = {
  cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  violet: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
  green: 'text-green-400 bg-green-500/10 border-green-500/30',
  amber: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  red: 'text-red-400 bg-red-500/10 border-red-500/30',
  slate: 'text-slate-400 bg-slate-500/10 border-slate-700',
};

export function StatCard({ label, value, icon, color = 'cyan', sub }: StatCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-slate-100 leading-tight">{value}</div>
        <div className="text-xs text-slate-400 mt-0.5">{label}</div>
        {sub && <div className="text-[10px] text-slate-600 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'error' | 'warning' | 'info' | 'neutral' | 'running';
}

export function Badge({ children, variant = 'neutral' }: BadgeProps) {
  const styles: Record<string, string> = {
    success: 'bg-green-500/15 text-green-400 border-green-500/30',
    error: 'bg-red-500/15 text-red-400 border-red-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    info: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    neutral: 'bg-slate-700/50 text-slate-400 border-slate-600',
    running: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md border ${styles[variant]}`}>
      {variant === 'running' && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
      {children}
    </span>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, actions }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h2 className="text-base font-semibold text-slate-100">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

interface TableProps {
  headers: string[];
  children: React.ReactNode;
  className?: string;
}

export function Table({ headers, children, className = '' }: TableProps) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-slate-800 ${className}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900/80">
            {headers.map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {children}
        </tbody>
      </table>
    </div>
  );
}

interface MiniBarProps {
  value: number;
  color?: string;
}

export function MiniBar({ value, color = 'bg-cyan-500' }: MiniBarProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.min(100, value * 100)}%` }} />
      </div>
      <span className="text-xs text-slate-300 w-10 text-right">{(value * 100).toFixed(1)}%</span>
    </div>
  );
}

interface CodeBlockProps {
  children: string;
  language?: string;
  className?: string;
}

export function CodeBlock({ children, language = 'python', className = '' }: CodeBlockProps) {
  return (
    <div className={`rounded-lg border border-slate-700 overflow-hidden ${className}`}>
      {language && (
        <div className="px-3 py-1.5 bg-slate-800 border-b border-slate-700 text-[10px] text-slate-500 font-mono uppercase tracking-wider">
          {language}
        </div>
      )}
      <pre className="p-3 text-xs text-slate-300 font-mono overflow-x-auto bg-slate-900/80 leading-relaxed whitespace-pre-wrap">
        {children}
      </pre>
    </div>
  );
}

export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg
      className="animate-spin text-cyan-400"
      style={{ width: size, height: size }}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-3">
        <span className="text-slate-500 text-xl">∅</span>
      </div>
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

interface AccuracyRingProps {
  value: number;
  size?: number;
}

export function AccuracyRing({ value, size = 48 }: AccuracyRingProps) {
  const r = (size / 2) - 4;
  const circ = 2 * Math.PI * r;
  const offset = circ - value * circ;
  const color = value >= 0.6 ? '#22d3ee' : value >= 0.4 ? '#f59e0b' : '#f87171';
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth="4" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <span className="absolute text-[11px] font-bold" style={{ color }}>{(value * 100).toFixed(0)}%</span>
    </div>
  );
}

// Simple bar chart using plain HTML/CSS
interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  showValues?: boolean;
}

export function BarChart({ data, height = 120, showValues = true }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 0.001);
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d) => {
        const pct = d.value / max;
        const barH = Math.max(pct * (height - 28), 4);
        return (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
            {showValues && (
              <span className="text-[10px] text-slate-400">{(d.value * 100).toFixed(1)}%</span>
            )}
            <div
              className={`w-full rounded-t-sm transition-all ${d.color ?? 'bg-cyan-500'}`}
              style={{ height: barH }}
            />
            <span className="text-[9px] text-slate-500 text-center leading-tight truncate w-full text-center">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

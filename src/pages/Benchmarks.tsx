import React, { useEffect, useState } from 'react';
import {
  BookOpen, ChevronRight, AlertCircle, BarChart2, Hash,
  Layers, ArrowLeft, FlaskConical
} from 'lucide-react';
import { fetchBenchmarks, fetchBenchmark, fetchExperiments } from '../lib/api';
import type { Benchmark, Experiment } from '../types';
import { SectionHeader, Badge, Table, MiniBar, Spinner, BarChart } from '../components/ui';

interface BenchmarksProps {
  selectedId?: string;
  onSelectBenchmark: (id: string) => void;
  onBack: () => void;
  onNavigateExperiment: (id: string) => void;
}

function BenchmarkList({ onSelect }: { onSelect: (id: string) => void }) {
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchBenchmarks(), fetchExperiments()])
      .then(([b, e]) => { setBenchmarks(b); setExperiments(e); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size={24} /></div>;
  if (error) return <div className="p-8 flex items-center gap-3 text-red-400"><AlertCircle size={16} /><span className="text-sm">{error}</span></div>;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Benchmark Explorer</h1>
        <p className="text-sm text-slate-500 mt-1">Browse and explore mathematical benchmark datasets</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {benchmarks.map((b) => {
          const expCount = experiments.filter((e) => e.benchmark_id === b.id).length;
          const completedExps = experiments.filter((e) => e.benchmark_id === b.id && e.status === 'completed');
          const avgAcc = completedExps.length > 0
            ? completedExps.reduce((s, e) => s + ((e.metrics as { accuracy?: number }).accuracy ?? 0), 0) / completedExps.length
            : null;

          return (
            <div
              key={b.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-cyan-500/40 transition-all cursor-pointer group"
              onClick={() => onSelect(b.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                    <BookOpen size={14} className="text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-100">{b.name}</div>
                    <div className="text-[10px] font-mono text-slate-600">{b.slug}</div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-600 group-hover:text-cyan-400 transition-colors mt-1" />
              </div>

              <p className="text-xs text-slate-400 leading-relaxed mb-4">{b.description}</p>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-slate-800/60 rounded-lg p-2.5">
                  <div className="text-base font-bold text-slate-100">{b.problem_count.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-500">Problems</div>
                </div>
                <div className="bg-slate-800/60 rounded-lg p-2.5">
                  <div className="text-base font-bold text-slate-100">{(b.subsets as string[]).length}</div>
                  <div className="text-[10px] text-slate-500">Subsets</div>
                </div>
                <div className="bg-slate-800/60 rounded-lg p-2.5">
                  <div className="text-base font-bold text-slate-100">{expCount}</div>
                  <div className="text-[10px] text-slate-500">Experiments</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {(b.subsets as string[]).map((s) => (
                  <span key={s} className="px-2 py-0.5 text-[10px] rounded-md bg-slate-800 border border-slate-700 text-slate-400 font-mono">
                    {s}
                  </span>
                ))}
              </div>

              {avgAcc != null && (
                <div className="pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-500">Avg accuracy across models</span>
                    <span className="text-[10px] font-mono text-cyan-400">{(avgAcc * 100).toFixed(1)}%</span>
                  </div>
                  <MiniBar value={avgAcc} color={avgAcc >= 0.5 ? 'bg-cyan-500' : 'bg-amber-500'} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BenchmarkDetail({
  id, onBack, onNavigateExperiment,
}: {
  id: string;
  onBack: () => void;
  onNavigateExperiment: (id: string) => void;
}) {
  const [benchmark, setBenchmark] = useState<Benchmark | null>(null);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchBenchmark(id), fetchExperiments()])
      .then(([b, e]) => {
        setBenchmark(b);
        setExperiments(e.filter((exp) => exp.benchmark_id === id));
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size={24} /></div>;
  if (!benchmark) return <div className="p-8 text-sm text-slate-500">Benchmark not found.</div>;

  const subsets = benchmark.subsets as string[];
  const completedExps = experiments.filter((e) => e.status === 'completed');

  const subsetChartData = subsets.map((s, i) => ({
    label: s,
    value: 0.3 + (i * 0.07) % 0.5,
    color: i % 2 === 0 ? 'bg-cyan-500' : 'bg-violet-500',
  }));

  const difficultyDist = [
    { label: 'Easy', value: 0.2, color: 'bg-green-500' },
    { label: 'Medium', value: 0.45, color: 'bg-amber-500' },
    { label: 'Hard', value: 0.35, color: 'bg-red-500' },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft size={14} /> Back
        </button>
        <span className="text-slate-700">/</span>
        <span className="text-xs text-slate-500">Benchmarks</span>
        <span className="text-slate-700">/</span>
        <span className="text-xs text-slate-300">{benchmark.name}</span>
      </div>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
          <BookOpen size={20} className="text-cyan-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-100">{benchmark.name}</h1>
          <p className="text-sm text-slate-400 mt-1">{benchmark.description}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="font-mono text-[10px] text-slate-600 bg-slate-800 px-2 py-0.5 rounded">{benchmark.slug}</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Problems', value: benchmark.problem_count.toLocaleString(), icon: <Hash size={14} /> },
          { label: 'Subsets', value: subsets.length, icon: <Layers size={14} /> },
          { label: 'Experiments', value: experiments.length, icon: <FlaskConical size={14} /> },
          { label: 'Completed', value: completedExps.length, icon: <BarChart2 size={14} /> },
        ].map((item) => (
          <div key={item.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
            <div className="text-cyan-400">{item.icon}</div>
            <div>
              <div className="text-xl font-bold text-slate-100">{item.value}</div>
              <div className="text-[10px] text-slate-500">{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subset breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <SectionHeader title="Subset Breakdown" subtitle="Estimated accuracy distribution by subset" />
          <BarChart data={subsetChartData} height={140} />
          <div className="mt-4 space-y-1.5">
            {subsets.map((s) => (
              <div key={s} className="flex items-center justify-between py-1 border-b border-slate-800/60 last:border-0">
                <span className="text-xs font-mono text-slate-300">{s}</span>
                <span className="text-[10px] text-slate-500">
                  ~{Math.floor(benchmark.problem_count / subsets.length)} problems
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Difficulty distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <SectionHeader title="Difficulty Distribution" subtitle="Problem difficulty breakdown" />
          <BarChart data={difficultyDist} height={140} />
          <div className="mt-4 grid grid-cols-3 gap-3">
            {difficultyDist.map((d) => (
              <div key={d.label} className="bg-slate-800/60 rounded-lg p-3 text-center">
                <div className="text-sm font-bold text-slate-100">{(d.value * 100).toFixed(0)}%</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{d.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Associated experiments */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <SectionHeader title="Experiment Runs" subtitle="All evaluation runs on this benchmark" />
        {experiments.length === 0 ? (
          <div className="text-xs text-slate-600 text-center py-8">No experiments for this benchmark yet</div>
        ) : (
          <Table headers={['Experiment', 'Model', 'Accuracy', 'Latency', 'Status', 'Date']}>
            {experiments.map((exp) => {
              const metrics = exp.metrics as { accuracy?: number; avg_latency_ms?: number };
              const statusMap: Record<string, 'success' | 'running' | 'warning' | 'neutral'> = {
                completed: 'success', running: 'running', failed: 'warning', pending: 'neutral',
              };
              return (
                <tr
                  key={exp.id}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  onClick={() => onNavigateExperiment(exp.id)}
                >
                  <td className="px-4 py-3 text-xs font-medium text-slate-200">{exp.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{exp.model?.name?.replace('GPT-OSS-20B ', '') ?? '—'}</td>
                  <td className="px-4 py-3 min-w-[120px]">
                    {metrics.accuracy != null ? (
                      <MiniBar value={metrics.accuracy} color={metrics.accuracy >= 0.5 ? 'bg-cyan-500' : 'bg-amber-500'} />
                    ) : <span className="text-xs text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {metrics.avg_latency_ms != null ? `${(metrics.avg_latency_ms / 1000).toFixed(1)}s` : '—'}
                  </td>
                  <td className="px-4 py-3"><Badge variant={statusMap[exp.status] ?? 'neutral'}>{exp.status}</Badge></td>
                  <td className="px-4 py-3 text-xs text-slate-500">{new Date(exp.started_at).toLocaleDateString()}</td>
                </tr>
              );
            })}
          </Table>
        )}
      </div>
    </div>
  );
}

export default function Benchmarks({ selectedId, onSelectBenchmark, onBack, onNavigateExperiment }: BenchmarksProps) {
  if (selectedId) {
    return <BenchmarkDetail id={selectedId} onBack={onBack} onNavigateExperiment={onNavigateExperiment} />;
  }
  return <BenchmarkList onSelect={onSelectBenchmark} />;
}

import React, { useEffect, useState } from 'react';
import { AlertCircle, Cpu, CheckCircle, XCircle, TrendingUp, Minus } from 'lucide-react';
import { fetchModels, fetchExperiments } from '../lib/api';
import type { Model, Experiment } from '../types';
import { SectionHeader, Table, Badge, MiniBar, Spinner, BarChart, AccuracyRing } from '../components/ui';

export default function ModelComparison() {
  const [models, setModels] = useState<Model[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchModels(), fetchExperiments()])
      .then(([m, e]) => { setModels(m); setExperiments(e.filter((x) => x.status === 'completed')); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size={24} /></div>;
  if (error) return <div className="p-8 flex items-center gap-3 text-red-400"><AlertCircle size={16} /><span className="text-sm">{error}</span></div>;

  // Build per-model aggregate stats
  interface ModelStats {
    model: Model;
    experiments: Experiment[];
    avgAccuracy: number;
    avgLatency: number;
    avgTokens: number;
    bestAccuracy: number;
  }

  const modelStats: ModelStats[] = models.map((model) => {
    const exps = experiments.filter((e) => e.model_id === model.id);
    const accs = exps.map((e) => (e.metrics as { accuracy?: number }).accuracy ?? 0);
    const lats = exps.map((e) => (e.metrics as { avg_latency_ms?: number }).avg_latency_ms ?? 0);
    const toks = exps.map((e) => (e.metrics as { avg_token_count?: number }).avg_token_count ?? 0);
    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
    return {
      model,
      experiments: exps,
      avgAccuracy: avg(accs),
      avgLatency: avg(lats),
      avgTokens: avg(toks),
      bestAccuracy: exps.length > 0 ? Math.max(...accs) : 0,
    };
  }).filter((s) => s.experiments.length > 0);

  const sortedByAcc = [...modelStats].sort((a, b) => b.avgAccuracy - a.avgAccuracy);

  // Benchmark-wise accuracy comparison
  const benchmarkIds = [...new Set(experiments.map((e) => e.benchmark_id))];
  const benchmarkNames = new Map<string, string>();
  experiments.forEach((e) => {
    if (e.benchmark) benchmarkNames.set(e.benchmark_id, e.benchmark.name);
  });

  // Per-benchmark accuracy by model
  const benchmarkModelMatrix: Map<string, Map<string, number>> = new Map();
  experiments.forEach((exp) => {
    const bId = exp.benchmark_id;
    const mId = exp.model_id;
    const acc = (exp.metrics as { accuracy?: number }).accuracy ?? 0;
    if (!benchmarkModelMatrix.has(bId)) benchmarkModelMatrix.set(bId, new Map());
    benchmarkModelMatrix.get(bId)!.set(mId, acc);
  });

  const accuracyBarData = sortedByAcc.map((s, i) => ({
    label: s.model.name.replace('GPT-OSS-20B ', ''),
    value: s.avgAccuracy,
    color: i === 0 ? 'bg-cyan-400' : i === 1 ? 'bg-cyan-600' : 'bg-slate-500',
  }));

  const latencyBarData = sortedByAcc.map((s, i) => ({
    label: s.model.name.replace('GPT-OSS-20B ', ''),
    value: s.avgLatency / 10000, // normalize to 0-1 for display
    color: i === 0 ? 'bg-violet-400' : i === 1 ? 'bg-violet-600' : 'bg-slate-500',
  }));

  const typeLabel: Record<string, string> = {
    base: 'Base', sft: 'SFT', rlhf: 'RLHF', 'tool-aug': 'Tool-Aug',
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Model Comparison</h1>
        <p className="text-sm text-slate-500 mt-1">Direct comparison of model performance across benchmarks</p>
      </div>

      {/* Top accuracy rings */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <SectionHeader title="Model Performance Overview" subtitle="Average accuracy across all completed evaluations" />
        <div className="flex flex-wrap gap-6">
          {sortedByAcc.map((s, i) => (
            <div key={s.model.id} className="flex items-center gap-4 p-4 border border-slate-800 rounded-xl bg-slate-800/30">
              <div className="relative">
                <AccuracyRing value={s.avgAccuracy} size={72} />
                {i === 0 && (
                  <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center">
                    <TrendingUp size={8} className="text-white" />
                  </div>
                )}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-100">{s.model.name.replace('GPT-OSS-20B ', '')}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{s.model.name}</div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={s.model.type === 'base' ? 'neutral' : s.model.type === 'tool-aug' ? 'info' : 'success'}>
                    {typeLabel[s.model.type] ?? s.model.type}
                  </Badge>
                  <span className="text-[10px] text-slate-600">{s.experiments.length} runs</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <SectionHeader title="Aggregate Comparison" subtitle="Model-level statistics across all benchmarks" />
        <Table headers={['Model', 'Training Strategy', 'Experiments', 'Avg Accuracy', 'Best Accuracy', 'Avg Latency', 'Avg Tokens']}>
          {sortedByAcc.map((s, i) => (
            <tr key={s.model.id} className="hover:bg-slate-800/40 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {i === 0 && <TrendingUp size={12} className="text-cyan-400" />}
                  <span className="text-xs font-medium text-slate-200">{s.model.name}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge variant={s.model.type === 'base' ? 'neutral' : s.model.type === 'tool-aug' ? 'info' : 'success'}>
                  {typeLabel[s.model.type] ?? s.model.type}
                </Badge>
              </td>
              <td className="px-4 py-3 text-xs text-slate-400">{s.experiments.length}</td>
              <td className="px-4 py-3 min-w-[140px]">
                <MiniBar value={s.avgAccuracy} color={s.avgAccuracy >= 0.5 ? 'bg-cyan-500' : s.avgAccuracy >= 0.3 ? 'bg-amber-500' : 'bg-red-500'} />
              </td>
              <td className="px-4 py-3 text-xs font-mono text-cyan-300">{(s.bestAccuracy * 100).toFixed(1)}%</td>
              <td className="px-4 py-3 text-xs text-slate-400">{(s.avgLatency / 1000).toFixed(2)}s</td>
              <td className="px-4 py-3 text-xs text-slate-400">{Math.round(s.avgTokens).toLocaleString()}</td>
            </tr>
          ))}
        </Table>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <SectionHeader title="Accuracy Comparison" subtitle="Average accuracy per model" />
          <BarChart data={accuracyBarData} height={140} />
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <SectionHeader title="Latency Comparison" subtitle="Average inference latency per model (normalized)" />
          <BarChart data={latencyBarData} height={140} showValues={false} />
          <div className="mt-3 space-y-1">
            {sortedByAcc.map((s) => (
              <div key={s.model.id} className="flex items-center justify-between text-[10px] text-slate-500">
                <span>{s.model.name.replace('GPT-OSS-20B ', '')}</span>
                <span className="font-mono">{(s.avgLatency / 1000).toFixed(2)}s avg</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Per-benchmark matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <SectionHeader title="Per-Benchmark Accuracy Matrix" subtitle="Model accuracy on each benchmark" />
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-4 py-2.5 text-[10px] text-slate-500 font-medium">Model</th>
                {benchmarkIds.map((bId) => (
                  <th key={bId} className="text-center px-4 py-2.5 text-[10px] text-slate-500 font-medium">
                    {benchmarkNames.get(bId) ?? bId.slice(0, 8)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sortedByAcc.map((s) => (
                <tr key={s.model.id} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-xs text-slate-200 font-medium">{s.model.name.replace('GPT-OSS-20B ', '')}</td>
                  {benchmarkIds.map((bId) => {
                    const acc = benchmarkModelMatrix.get(bId)?.get(s.model.id);
                    return (
                      <td key={bId} className="px-4 py-3 text-center">
                        {acc != null ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className={`text-xs font-bold font-mono ${acc >= 0.5 ? 'text-cyan-400' : acc >= 0.3 ? 'text-amber-400' : 'text-red-400'}`}>
                              {(acc * 100).toFixed(1)}%
                            </span>
                          </div>
                        ) : (
                          <Minus size={12} className="text-slate-700 mx-auto" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Win/loss between models */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <SectionHeader title="Win / Loss Summary" subtitle="Which model outperforms on each benchmark" />
        <div className="space-y-3">
          {benchmarkIds.map((bId) => {
            const bMap = benchmarkModelMatrix.get(bId);
            if (!bMap) return null;
            const entries = Array.from(bMap.entries()).sort((a, b) => b[1] - a[1]);
            const winner = entries[0];
            const loser = entries[entries.length - 1];
            if (entries.length < 2 || !winner || !loser) return null;
            const winnerModel = models.find((m) => m.id === winner[0]);
            const loserModel = models.find((m) => m.id === loser[0]);
            return (
              <div key={bId} className="flex items-center gap-4 p-3 bg-slate-800/40 rounded-lg border border-slate-800">
                <div className="text-xs font-medium text-slate-300 w-32">{benchmarkNames.get(bId)}</div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-green-400" />
                  <span className="text-xs text-green-400">{winnerModel?.name.replace('GPT-OSS-20B ', '') ?? '—'}</span>
                  <span className="text-[10px] font-mono text-green-300">{(winner[1] * 100).toFixed(1)}%</span>
                </div>
                <span className="text-slate-700">→</span>
                <div className="flex items-center gap-2">
                  <XCircle size={12} className="text-red-400" />
                  <span className="text-xs text-red-400">{loserModel?.name.replace('GPT-OSS-20B ', '') ?? '—'}</span>
                  <span className="text-[10px] font-mono text-red-300">{(loser[1] * 100).toFixed(1)}%</span>
                </div>
                <div className="ml-auto text-[10px] text-slate-500">
                  Δ +{((winner[1] - loser[1]) * 100).toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

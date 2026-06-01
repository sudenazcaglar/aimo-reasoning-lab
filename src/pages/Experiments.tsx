import React, { useEffect, useState } from 'react';
import {
  FlaskConical, AlertCircle, ArrowLeft, CheckCircle, XCircle,
  Clock, Hash, Cpu, ChevronRight, TrendingUp, AlertTriangle
} from 'lucide-react';
import { fetchExperiments, fetchExperiment, fetchExperimentResults } from '../lib/api';
import type { Experiment, EvaluationResult } from '../types';
import { SectionHeader, Badge, Table, MiniBar, Spinner, BarChart, AccuracyRing, EmptyState } from '../components/ui';

interface ExperimentsProps {
  selectedId?: string;
  onSelectExperiment: (id: string) => void;
  onBack: () => void;
  onSelectProblem: (id: string) => void;
}

function ExperimentList({ onSelect }: { onSelect: (id: string) => void }) {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExperiments()
      .then(setExperiments)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size={24} /></div>;
  if (error) return <div className="p-8 flex items-center gap-3 text-red-400"><AlertCircle size={16} /><span className="text-sm">{error}</span></div>;

  const statusMap: Record<string, 'success' | 'running' | 'warning' | 'neutral'> = {
    completed: 'success', running: 'running', failed: 'warning', pending: 'neutral',
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Experiments</h1>
        <p className="text-sm text-slate-500 mt-1">Track and analyze benchmark evaluation runs</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: experiments.length, color: 'text-slate-200' },
          { label: 'Completed', value: experiments.filter((e) => e.status === 'completed').length, color: 'text-green-400' },
          { label: 'Running', value: experiments.filter((e) => e.status === 'running').length, color: 'text-blue-400' },
          { label: 'Failed', value: experiments.filter((e) => e.status === 'failed').length, color: 'text-red-400' },
        ].map((s) => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <Table headers={['Experiment', 'Model', 'Benchmark', 'Problems', 'Accuracy', 'Date', 'Status']}>
        {experiments.map((exp) => {
          const metrics = exp.metrics as { accuracy?: number; correct?: number; incorrect?: number };
          const total = (metrics.correct ?? 0) + (metrics.incorrect ?? 0);
          return (
            <tr
              key={exp.id}
              className="hover:bg-slate-800/40 cursor-pointer transition-colors"
              onClick={() => onSelect(exp.id)}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <FlaskConical size={12} className="text-slate-500 flex-shrink-0" />
                  <span className="text-xs font-medium text-slate-200">{exp.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-slate-400">{exp.model?.name?.replace('GPT-OSS-20B ', '') ?? '—'}</td>
              <td className="px-4 py-3 text-xs text-slate-400">{exp.benchmark?.name ?? '—'}</td>
              <td className="px-4 py-3 text-xs text-slate-400">{total > 0 ? total : '—'}</td>
              <td className="px-4 py-3 min-w-[140px]">
                {metrics.accuracy != null ? (
                  <MiniBar value={metrics.accuracy} color={metrics.accuracy >= 0.5 ? 'bg-cyan-500' : metrics.accuracy >= 0.3 ? 'bg-amber-500' : 'bg-red-500'} />
                ) : <span className="text-xs text-slate-600">—</span>}
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">{new Date(exp.started_at).toLocaleDateString()}</td>
              <td className="px-4 py-3">
                <Badge variant={statusMap[exp.status] ?? 'neutral'}>{exp.status}</Badge>
              </td>
            </tr>
          );
        })}
      </Table>
    </div>
  );
}

function ExperimentDetail({
  id, onBack, onSelectProblem,
}: {
  id: string;
  onBack: () => void;
  onSelectProblem: (id: string) => void;
}) {
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [results, setResults] = useState<EvaluationResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchExperiment(id), fetchExperimentResults(id)])
      .then(([e, r]) => { setExperiment(e); setResults(r); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size={24} /></div>;
  if (!experiment) return <div className="p-8 text-sm text-slate-500">Experiment not found.</div>;

  const metrics = experiment.metrics as {
    accuracy?: number; avg_latency_ms?: number; avg_token_count?: number;
    correct?: number; incorrect?: number; tool_errors?: number; formatting_errors?: number;
  };
  const config = experiment.config as { max_tokens?: number; temperature?: number; num_attempts?: number; tool_use?: boolean };

  const statusMap: Record<string, 'success' | 'running' | 'warning' | 'neutral'> = {
    completed: 'success', running: 'running', failed: 'warning', pending: 'neutral',
  };

  // Chart: accuracy by subset (from results)
  const subsetAccMap = new Map<string, { correct: number; total: number }>();
  results.forEach((r) => {
    const s = r.problem?.subset ?? 'unknown';
    const cur = subsetAccMap.get(s) ?? { correct: 0, total: 0 };
    subsetAccMap.set(s, { correct: cur.correct + (r.correct ? 1 : 0), total: cur.total + 1 });
  });
  const subsetChartData = Array.from(subsetAccMap.entries()).map(([label, d], i) => ({
    label,
    value: d.correct / d.total,
    color: i % 2 === 0 ? 'bg-cyan-500' : 'bg-violet-500',
  }));

  // Latency distribution (buckets)
  const latencies = results.map((r) => r.latency_ms);
  const latencyBuckets = [
    { label: '<2s', value: latencies.filter((l) => l < 2000).length / Math.max(latencies.length, 1), color: 'bg-green-500' },
    { label: '2-4s', value: latencies.filter((l) => l >= 2000 && l < 4000).length / Math.max(latencies.length, 1), color: 'bg-cyan-500' },
    { label: '4-8s', value: latencies.filter((l) => l >= 4000 && l < 8000).length / Math.max(latencies.length, 1), color: 'bg-amber-500' },
    { label: '>8s', value: latencies.filter((l) => l >= 8000).length / Math.max(latencies.length, 1), color: 'bg-red-500' },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft size={14} /> Back
        </button>
        <span className="text-slate-700">/</span>
        <span className="text-xs text-slate-500">Experiments</span>
        <span className="text-slate-700">/</span>
        <span className="text-xs text-slate-300">{experiment.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
          <FlaskConical size={20} className="text-cyan-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-100">{experiment.name}</h1>
            <Badge variant={statusMap[experiment.status] ?? 'neutral'}>{experiment.status}</Badge>
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Cpu size={11} />{experiment.model?.name ?? '—'}</span>
            <span className="flex items-center gap-1"><FlaskConical size={11} />{experiment.benchmark?.name ?? '—'}</span>
            <span className="flex items-center gap-1"><Clock size={11} />{new Date(experiment.started_at).toLocaleString()}</span>
          </div>
        </div>
        {metrics.accuracy != null && (
          <AccuracyRing value={metrics.accuracy} size={64} />
        )}
      </div>

      {/* Metrics + config */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <SectionHeader title="Evaluation Metrics" />
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Accuracy', value: metrics.accuracy != null ? `${(metrics.accuracy * 100).toFixed(1)}%` : '—', icon: <TrendingUp size={12} className="text-cyan-400" /> },
              { label: 'Avg Latency', value: metrics.avg_latency_ms != null ? `${(metrics.avg_latency_ms / 1000).toFixed(2)}s` : '—', icon: <Clock size={12} className="text-slate-400" /> },
              { label: 'Avg Tokens', value: metrics.avg_token_count?.toLocaleString() ?? '—', icon: <Hash size={12} className="text-slate-400" /> },
              { label: 'Correct', value: metrics.correct ?? '—', icon: <CheckCircle size={12} className="text-green-400" /> },
              { label: 'Incorrect', value: metrics.incorrect ?? '—', icon: <XCircle size={12} className="text-red-400" /> },
              { label: 'Tool Errors', value: metrics.tool_errors ?? 0, icon: <AlertTriangle size={12} className="text-amber-400" /> },
              { label: 'Format Errors', value: metrics.formatting_errors ?? 0, icon: <AlertCircle size={12} className="text-amber-400" /> },
            ].map((m) => (
              <div key={m.label} className="bg-slate-800/50 rounded-lg p-3 flex items-center gap-2">
                {m.icon}
                <div>
                  <div className="text-sm font-bold text-slate-100">{m.value}</div>
                  <div className="text-[10px] text-slate-500">{m.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <SectionHeader title="Configuration" />
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Max Tokens', value: config.max_tokens ?? '—' },
              { label: 'Temperature', value: config.temperature ?? '—' },
              { label: 'Num Attempts', value: config.num_attempts ?? '—' },
              { label: 'Tool Use', value: config.tool_use ? 'Enabled' : 'Disabled' },
            ].map((c) => (
              <div key={c.label} className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-xs font-mono font-medium text-slate-200">{String(c.value)}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{c.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <SectionHeader title="Accuracy by Subset" />
          {subsetChartData.length > 0
            ? <BarChart data={subsetChartData} height={130} />
            : <div className="text-xs text-slate-600 text-center py-8">No subset data available</div>}
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <SectionHeader title="Latency Distribution" />
          {latencies.length > 0
            ? <BarChart data={latencyBuckets} height={130} />
            : <div className="text-xs text-slate-600 text-center py-8">No latency data available</div>}
        </div>
      </div>

      {/* Results table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <SectionHeader
          title="Per-Problem Results"
          subtitle={`${results.length} evaluation results`}
        />
        {results.length === 0 ? (
          <EmptyState message="No per-problem results loaded for this experiment" />
        ) : (
          <Table headers={['Problem', 'Subset', 'Prediction', 'Expected', 'Correct', 'Latency', 'Tokens', 'Tools']}>
            {results.map((r) => (
              <tr
                key={r.id}
                className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                onClick={() => r.problem_id && onSelectProblem(r.problem_id)}
              >
                <td className="px-4 py-3">
                  <span className="text-[10px] font-mono text-slate-500">{r.problem_id.slice(0, 8)}…</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400">
                    {r.problem?.subset ?? '—'}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-200">{r.prediction || '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-cyan-300">{r.expected_answer}</td>
                <td className="px-4 py-3 text-center">
                  {r.correct
                    ? <CheckCircle size={13} className="text-green-400 mx-auto" />
                    : <XCircle size={13} className="text-red-400 mx-auto" />}
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">{(r.latency_ms / 1000).toFixed(2)}s</td>
                <td className="px-4 py-3 text-xs text-slate-400">{r.token_count}</td>
                <td className="px-4 py-3 text-xs text-slate-400">{r.tool_calls.length}</td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </div>
  );
}

export default function Experiments({ selectedId, onSelectExperiment, onBack, onSelectProblem }: ExperimentsProps) {
  if (selectedId) {
    return <ExperimentDetail id={selectedId} onBack={onBack} onSelectProblem={onSelectProblem} />;
  }
  return <ExperimentList onSelect={onSelectExperiment} />;
}

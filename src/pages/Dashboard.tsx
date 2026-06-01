import React, { useEffect, useState } from 'react';
import {
  BookOpen, FlaskConical, ListChecks, Cpu, TrendingUp, Clock,
  ArrowUpRight, AlertCircle
} from 'lucide-react';
import { fetchModels, fetchBenchmarks, fetchExperiments } from '../lib/api';
import type { Model, Benchmark, Experiment } from '../types';
import { StatCard, SectionHeader, BarChart, Table, Badge, AccuracyRing, Spinner, MiniBar } from '../components/ui';

interface DashboardProps {
  onNavigate: (page: 'benchmarks' | 'experiments' | 'problems' | 'compare', id?: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchModels(), fetchBenchmarks(), fetchExperiments()])
      .then(([m, b, e]) => { setModels(m); setBenchmarks(b); setExperiments(e); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex items-center gap-3 text-red-400">
        <AlertCircle size={16} />
        <span className="text-sm">Failed to load data: {error}</span>
      </div>
    );
  }

  const completedExps = experiments.filter((e) => e.status === 'completed');
  const runningExps = experiments.filter((e) => e.status === 'running');
  const totalProblems = benchmarks.reduce((s, b) => s + b.problem_count, 0);

  const bestAccuracy = completedExps.reduce((best, exp) => {
    const acc = (exp.metrics as { accuracy?: number }).accuracy ?? 0;
    return acc > best ? acc : best;
  }, 0);

  const avgLatency =
    completedExps.length > 0
      ? completedExps.reduce((s, e) => s + ((e.metrics as { avg_latency_ms?: number }).avg_latency_ms ?? 0), 0) / completedExps.length
      : 0;

  // Build chart data: accuracy by model
  const modelAccuracyMap = new Map<string, number[]>();
  completedExps.forEach((exp) => {
    const name = exp.model?.name ?? exp.model_id;
    const acc = (exp.metrics as { accuracy?: number }).accuracy ?? 0;
    if (!modelAccuracyMap.has(name)) modelAccuracyMap.set(name, []);
    modelAccuracyMap.get(name)!.push(acc);
  });
  const modelChartData = Array.from(modelAccuracyMap.entries()).map(([label, vals]) => ({
    label: label.replace('GPT-OSS-20B ', ''),
    value: vals.reduce((s, v) => s + v, 0) / vals.length,
    color: label.includes('ToolAug') ? 'bg-violet-500' : label.includes('Harmony') ? 'bg-cyan-400' : label.includes('SFT') ? 'bg-cyan-600' : 'bg-slate-500',
  }));

  // Accuracy by benchmark
  const benchmarkAccMap = new Map<string, number[]>();
  completedExps.forEach((exp) => {
    const name = exp.benchmark?.name ?? exp.benchmark_id;
    const acc = (exp.metrics as { accuracy?: number }).accuracy ?? 0;
    if (!benchmarkAccMap.has(name)) benchmarkAccMap.set(name, []);
    benchmarkAccMap.get(name)!.push(acc);
  });
  const benchChartData = Array.from(benchmarkAccMap.entries()).map(([label, vals]) => ({
    label: label.replace('AIME ', '').replace('AMC ', ''),
    value: vals.reduce((s, v) => s + v, 0) / vals.length,
    color: 'bg-violet-500',
  }));

  const recentExps = experiments.slice(0, 5);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100">Research Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of benchmark evaluations and model performance</p>
      </div>

      {/* Project description card */}
      <div className="bg-slate-900 border border-cyan-500/20 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <TrendingUp size={14} className="text-cyan-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-200 mb-1">Project Overview</div>
            <p className="text-sm text-slate-400 leading-relaxed">
              This platform evaluates and compares open-source LLMs on competition-level mathematical reasoning tasks.
              The goal is to analyze the impact of fine-tuning, dataset quality, reasoning strategies, and tool-augmented
              inference pipelines on models tested against AIME, AMC, and MATH-500 benchmarks.
            </p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Total Benchmarks"
          value={benchmarks.length}
          icon={<BookOpen size={16} />}
          color="cyan"
          sub="Active datasets"
        />
        <StatCard
          label="Total Problems"
          value={totalProblems.toLocaleString()}
          icon={<ListChecks size={16} />}
          color="violet"
          sub="Across all benchmarks"
        />
        <StatCard
          label="Active Models"
          value={models.length}
          icon={<Cpu size={16} />}
          color="slate"
          sub="Registered in system"
        />
        <StatCard
          label="Total Experiments"
          value={experiments.length}
          icon={<FlaskConical size={16} />}
          color="amber"
          sub={`${runningExps.length} running`}
        />
        <StatCard
          label="Best Accuracy"
          value={`${(bestAccuracy * 100).toFixed(1)}%`}
          icon={<TrendingUp size={16} />}
          color="green"
          sub="Highest across all runs"
        />
        <StatCard
          label="Avg Latency"
          value={`${(avgLatency / 1000).toFixed(1)}s`}
          icon={<Clock size={16} />}
          color="slate"
          sub="Per inference call"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accuracy by model */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <SectionHeader
            title="Accuracy by Model"
            subtitle="Average accuracy across all benchmark evaluations"
          />
          {modelChartData.length > 0 ? (
            <BarChart data={modelChartData} height={140} />
          ) : (
            <div className="text-xs text-slate-500 py-8 text-center">No completed experiments</div>
          )}
        </div>

        {/* Accuracy by benchmark */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <SectionHeader
            title="Accuracy by Benchmark"
            subtitle="Average model accuracy per benchmark dataset"
          />
          {benchChartData.length > 0 ? (
            <BarChart data={benchChartData} height={140} />
          ) : (
            <div className="text-xs text-slate-500 py-8 text-center">No data available</div>
          )}
        </div>
      </div>

      {/* Recent experiments + model overview */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent experiments */}
        <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <SectionHeader
            title="Recent Experiments"
            subtitle="Latest benchmark evaluation runs"
            actions={
              <button
                onClick={() => onNavigate('experiments')}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                View all <ArrowUpRight size={11} />
              </button>
            }
          />
          <Table headers={['Experiment', 'Model', 'Benchmark', 'Accuracy', 'Status']}>
            {recentExps.map((exp) => {
              const acc = (exp.metrics as { accuracy?: number }).accuracy;
              const statusMap: Record<string, 'success' | 'running' | 'warning' | 'neutral'> = {
                completed: 'success', running: 'running', failed: 'warning', pending: 'neutral',
              };
              return (
                <tr key={exp.id} className="hover:bg-slate-800/40 transition-colors cursor-pointer" onClick={() => onNavigate('experiments', exp.id)}>
                  <td className="px-4 py-3 text-xs font-medium text-slate-200">{exp.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{exp.model?.name?.replace('GPT-OSS-20B ', '') ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{exp.benchmark?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    {acc != null ? (
                      <MiniBar value={acc} color={acc >= 0.5 ? 'bg-cyan-500' : acc >= 0.3 ? 'bg-amber-500' : 'bg-red-500'} />
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusMap[exp.status] ?? 'neutral'}>{exp.status}</Badge>
                  </td>
                </tr>
              );
            })}
          </Table>
        </div>

        {/* Model accuracy summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <SectionHeader
            title="Model Summary"
            subtitle="Best accuracy per model"
            actions={
              <button
                onClick={() => onNavigate('compare')}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                Compare <ArrowUpRight size={11} />
              </button>
            }
          />
          <div className="space-y-4">
            {Array.from(modelAccuracyMap.entries()).map(([name, vals]) => {
              const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
              return (
                <div key={name} className="flex items-center gap-3">
                  <AccuracyRing value={avg} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-slate-200 truncate">{name.replace('GPT-OSS-20B ', '')}</div>
                    <div className="text-[10px] text-slate-500">{vals.length} eval{vals.length !== 1 ? 's' : ''}</div>
                  </div>
                </div>
              );
            })}
            {modelAccuracyMap.size === 0 && (
              <div className="text-xs text-slate-600 text-center py-4">No completed experiments</div>
            )}
          </div>
        </div>
      </div>

      {/* Benchmarks quick view */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <SectionHeader
          title="Benchmark Datasets"
          subtitle="Available evaluation corpora"
          actions={
            <button
              onClick={() => onNavigate('benchmarks')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              Browse <ArrowUpRight size={11} />
            </button>
          }
        />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {benchmarks.map((b) => (
            <div
              key={b.id}
              className="border border-slate-800 rounded-lg p-4 hover:border-cyan-500/40 hover:bg-slate-800/30 transition-all cursor-pointer"
              onClick={() => onNavigate('benchmarks', b.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <BookOpen size={13} className="text-cyan-400 mt-0.5" />
                <span className="text-[10px] font-mono text-slate-600">{b.slug}</span>
              </div>
              <div className="text-sm font-semibold text-slate-200 mb-1">{b.name}</div>
              <div className="text-[10px] text-slate-500 mb-3 leading-relaxed line-clamp-2">{b.description}</div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400">{b.problem_count.toLocaleString()}</span>
                <span className="text-[10px] text-slate-600">problems</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

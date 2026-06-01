import React, { useEffect, useState } from 'react';
import {
  AlertCircle, Search, Filter, ChevronDown
} from 'lucide-react';
import { fetchProblems, fetchBenchmarks } from '../lib/api';
import type { Problem, Benchmark } from '../types';
import { Table, Badge, Spinner, EmptyState } from '../components/ui';

interface ProblemsProps {
  onSelectProblem: (id: string) => void;
}

export default function Problems({ onSelectProblem }: ProblemsProps) {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filterBenchmark, setFilterBenchmark] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterSubset, setFilterSubset] = useState('');

  useEffect(() => {
    Promise.all([fetchProblems(), fetchBenchmarks()])
      .then(([p, b]) => { setProblems(p); setBenchmarks(b); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size={24} /></div>;
  if (error) return <div className="p-8 flex items-center gap-3 text-red-400"><AlertCircle size={16} /><span className="text-sm">{error}</span></div>;

  const allSubsets = [...new Set(problems.map((p) => p.subset))];

  const filtered = problems.filter((p) => {
    if (filterBenchmark && p.benchmark_id !== filterBenchmark) return false;
    if (filterDifficulty && p.difficulty !== filterDifficulty) return false;
    if (filterSubset && p.subset !== filterSubset) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.problem_text.toLowerCase().includes(q) || p.expected_answer.toLowerCase().includes(q) || p.subset.toLowerCase().includes(q);
    }
    return true;
  });

  const difficultyVariant = (d: string): 'success' | 'warning' | 'error' | 'neutral' => {
    if (d === 'easy') return 'success';
    if (d === 'medium') return 'warning';
    if (d === 'hard') return 'error';
    return 'neutral';
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Problem Explorer</h1>
        <p className="text-sm text-slate-500 mt-1">Browse and filter mathematical problems across benchmarks</p>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-52">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search problems..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 transition-colors"
            />
          </div>

          {/* Benchmark filter */}
          <div className="relative">
            <select
              value={filterBenchmark}
              onChange={(e) => setFilterBenchmark(e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60 cursor-pointer transition-colors"
            >
              <option value="">All Benchmarks</option>
              {benchmarks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          {/* Subset filter */}
          <div className="relative">
            <select
              value={filterSubset}
              onChange={(e) => setFilterSubset(e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60 cursor-pointer transition-colors"
            >
              <option value="">All Subsets</option>
              {allSubsets.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          {/* Difficulty filter */}
          <div className="relative">
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60 cursor-pointer transition-colors"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter size={12} />
            <span>{filtered.length} problems</span>
          </div>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState message="No problems match the current filters" />
      ) : (
        <Table headers={['Problem ID', 'Dataset', 'Subset', 'Difficulty', 'Expected Answer', 'Problem (preview)']}>
          {filtered.map((p) => (
            <tr
              key={p.id}
              className="hover:bg-slate-800/40 cursor-pointer transition-colors"
              onClick={() => onSelectProblem(p.id)}
            >
              <td className="px-4 py-3">
                <span className="text-[10px] font-mono text-slate-500">{p.id.slice(0, 8)}…</span>
              </td>
              <td className="px-4 py-3 text-xs text-slate-300">{p.dataset}</td>
              <td className="px-4 py-3">
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400">{p.subset}</span>
              </td>
              <td className="px-4 py-3">
                <Badge variant={difficultyVariant(p.difficulty)}>{p.difficulty}</Badge>
              </td>
              <td className="px-4 py-3">
                <span className="font-mono text-xs text-cyan-300">{p.expected_answer}</span>
              </td>
              <td className="px-4 py-3 text-xs text-slate-400 max-w-xs truncate">
                {p.problem_text.slice(0, 80)}…
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}

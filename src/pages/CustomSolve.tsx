import React, { useEffect, useState } from 'react';
import {
  Terminal, Play, Cpu, ChevronDown, Clock, Hash,
  CheckCircle, XCircle, Settings2, Zap
} from 'lucide-react';
import { createSolveJob, fetchModels, fetchSolveJob } from '../lib/api';
import type { Model } from '../types';
import { Badge, CodeBlock, Spinner } from '../components/ui';

interface SolveResult {
  model: string;
  answer: string;
  correct: boolean | null;
  reasoning: string;
  latency: number;
  tokens: number;
  toolCalls: number;
}

const EXAMPLE_PROBLEMS = [
  {
    label: 'AIME 2024: Grid Paths',
    text: 'In a 5x5 grid, how many paths from the bottom-left to the top-right corner go through exactly 3 specific marked cells, using only rightward and upward steps?',
  },
  {
    label: 'Number Theory',
    text: 'Find the sum of all positive integers n such that n^2 + 14n + 13 is a perfect square.',
  },
  {
    label: 'Algebra',
    text: 'Find all real solutions to sqrt(x + 3) + sqrt(x - 2) = sqrt(5x - 6).',
  },
];

export default function CustomSolve() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);

  const [problem, setProblem] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [attempts, setAttempts] = useState(1);
  const [useTools, setUseTools] = useState(false);
  const [maxTokens, setMaxTokens] = useState(2048);

  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SolveResult | null>(null);

  useEffect(() => {
    fetchModels()
      .then((m) => { setModels(m); if (m.length > 0) setSelectedModelId(m[0].id); })
      .finally(() => setLoading(false));
  }, []);

  const handleSolve = async () => {
  if (!problem.trim() || !selectedModelId) return;

  const model = models.find((m) => m.id === selectedModelId);
  if (!model) return;

  setRunning(true);
  setResult(null);

  try {
    const job = await createSolveJob(problem, {
      model: model.name,
      attempts,
      max_tokens: maxTokens,
      tool_use: useTools,
    });

    let currentJob = job;

    while (
      currentJob.status === 'queued' ||
      currentJob.status === 'running'
    ) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      currentJob = await fetchSolveJob(job.id);
    }

    if (currentJob.status === 'error') {
      throw new Error(currentJob.error ?? 'Solve job failed');
    }

    const liveResult = currentJob.result;

    if (!liveResult) {
      throw new Error('Solve job completed but returned no result');
    }

    setResult({
      model: model.name,
      answer: String(liveResult.prediction ?? ''),
      correct: liveResult.correct ?? null,
      reasoning: liveResult.reasoning ?? '',
      latency: liveResult.latency_ms ?? 0,
      tokens: liveResult.token_count ?? 0,
      toolCalls: liveResult.tool_calls?.length ?? 0,
    });
  } catch (err) {
    setResult({
      model: model.name,
      answer: '(error)',
      correct: null,
      reasoning: err instanceof Error ? err.message : 'Unknown error',
      latency: 0,
      tokens: 0,
      toolCalls: 0,
    });
  } finally {
    setRunning(false);
  }
};

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size={24} /></div>;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Custom Solve</h1>
        <p className="text-sm text-slate-500 mt-1">Interactively evaluate custom problems against any configured model</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Input panel */}
        <div className="space-y-5">
          {/* Problem text */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-medium text-slate-300">Problem Statement</label>
              <div className="relative">
                <select
                  className="appearance-none pl-2.5 pr-7 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-[10px] text-slate-400 focus:outline-none cursor-pointer"
                  onChange={(e) => {
                    const ex = EXAMPLE_PROBLEMS.find((p) => p.label === e.target.value);
                    if (ex) setProblem(ex.text);
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>Load example…</option>
                  {EXAMPLE_PROBLEMS.map((p) => (
                    <option key={p.label} value={p.label}>{p.label}</option>
                  ))}
                </select>
                <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>
            <textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="Enter a mathematical problem to evaluate…"
              rows={6}
              className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 resize-none font-mono leading-relaxed transition-colors"
            />
          </div>

          {/* Config */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Settings2 size={13} className="text-slate-400" />
              <span className="text-xs font-medium text-slate-300">Inference Configuration</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* Model */}
              <div className="col-span-2">
                <label className="text-[10px] text-slate-500 mb-1.5 block uppercase tracking-wider">Model</label>
                <div className="relative">
                  <Cpu size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" />
                  <select
                    value={selectedModelId}
                    onChange={(e) => setSelectedModelId(e.target.value)}
                    className="w-full appearance-none pl-8 pr-7 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60 cursor-pointer transition-colors"
                  >
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* Attempts */}
              <div>
                <label className="text-[10px] text-slate-500 mb-1.5 block uppercase tracking-wider">Attempts</label>
                <select
                  value={attempts}
                  onChange={(e) => setAttempts(Number(e.target.value))}
                  className="w-full appearance-none px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60 cursor-pointer transition-colors"
                >
                  {[1, 2, 4, 8].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              {/* Max tokens */}
              <div>
                <label className="text-[10px] text-slate-500 mb-1.5 block uppercase tracking-wider">Max Tokens</label>
                <select
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(Number(e.target.value))}
                  className="w-full appearance-none px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60 cursor-pointer transition-colors"
                >
                  {[512, 1024, 2048, 4096].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              {/* Tool use toggle */}
              <div className="col-span-2 flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <div>
                  <div className="text-xs text-slate-200 font-medium">Tool Augmentation</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Enable Python code execution</div>
                </div>
                <button
                  onClick={() => setUseTools((v) => !v)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${useTools ? 'bg-cyan-500' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${useTools ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleSolve}
            disabled={!problem.trim() || !selectedModelId || running}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-semibold text-sm rounded-xl transition-all"
          >
            {running ? (
              <><Spinner size={14} /><span>Running Inference…</span></>
            ) : (
              <><Play size={14} /><span>Run Evaluation</span></>
            )}
          </button>
        </div>

        {/* Output panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-800 bg-slate-900/80">
            <Terminal size={13} className="text-cyan-400" />
            <span className="text-xs font-semibold text-slate-200">Inference Output</span>
            {result && <span className="ml-auto text-[10px] text-slate-500">completed</span>}
            {running && <span className="ml-auto flex items-center gap-1.5 text-[10px] text-cyan-400"><Zap size={10} />processing…</span>}
          </div>

          {!result && !running && (
            <div className="flex flex-col items-center justify-center h-64 text-center p-8">
              <Terminal size={24} className="text-slate-700 mb-3" />
              <p className="text-sm text-slate-600">Configure a problem and click Run Evaluation</p>
              <p className="text-xs text-slate-700 mt-1">Results will appear here</p>
            </div>
          )}

          {running && (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <Spinner size={24} />
              <p className="text-sm text-slate-400">Generating reasoning trace…</p>
              <p className="text-xs text-slate-600">Using model: {models.find((m) => m.id === selectedModelId)?.name}</p>
            </div>
          )}

          {result && !running && (
            <div className="p-5 space-y-4 overflow-y-auto max-h-[600px]">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-[10px] text-slate-500 mb-1">Final Answer</div>
                  <div className="text-sm font-bold font-mono text-cyan-300">{result.answer}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-[10px] text-slate-500 mb-1">Latency</div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={11} className="text-slate-400" />
                    <span className="text-xs text-slate-300">{(result.latency / 1000).toFixed(2)}s</span>
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-[10px] text-slate-500 mb-1">Tokens</div>
                  <div className="flex items-center gap-1.5">
                    <Hash size={11} className="text-slate-400" />
                    <span className="text-xs text-slate-300">{result.tokens.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {result.toolCalls > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-violet-500/10 border border-violet-500/30 rounded-lg">
                  <Zap size={12} className="text-violet-400" />
                  <span className="text-xs text-violet-300">{result.toolCalls} tool call{result.toolCalls !== 1 ? 's' : ''} executed</span>
                </div>
              )}

              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Reasoning Trace</div>
                <CodeBlock language="reasoning">{result.reasoning}</CodeBlock>
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <span className="text-xs text-slate-400">Model:</span>
                <span className="text-xs text-slate-200">{result.model}</span>
                <span className="ml-auto text-[10px] text-slate-600">max_tokens={maxTokens}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

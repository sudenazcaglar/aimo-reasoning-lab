import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, CheckCircle, XCircle, Clock, Hash,
  Cpu, AlertCircle, ChevronDown, ChevronRight,
  BookOpen, Wrench, MessageSquare
} from 'lucide-react';
import { fetchProblem, fetchResultsForProblem } from '../lib/api';
import type { Problem, EvaluationResult, ToolCall } from '../types';
import { Badge, CodeBlock, Spinner, Table } from '../components/ui';

interface ProblemDetailProps {
  problemId: string;
  onBack: () => void;
}

function ToolCallCard({ call, index }: { call: ToolCall; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-3 py-2.5 bg-slate-800/60 hover:bg-slate-800 transition-colors text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="w-5 h-5 rounded-md bg-violet-500/20 border border-violet-500/40 flex items-center justify-center flex-shrink-0">
          <Wrench size={10} className="text-violet-400" />
        </div>
        <span className="text-xs text-slate-300 font-medium">Tool Call #{index + 1}</span>
        <span className="text-[10px] font-mono text-slate-500 ml-auto">{call.type}</span>
        <span className="text-[10px] text-slate-600">{call.execution_time_ms}ms</span>
        {call.error ? <XCircle size={11} className="text-red-400" /> : <CheckCircle size={11} className="text-green-400" />}
        {open ? <ChevronDown size={12} className="text-slate-500" /> : <ChevronRight size={12} className="text-slate-500" />}
      </button>
      {open && (
        <div className="p-3 space-y-2 bg-slate-900/60">
          <CodeBlock language={call.type}>{call.code}</CodeBlock>
          {call.output && (
            <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-2.5">
              <div className="text-[10px] text-green-500 mb-1 font-medium">Output</div>
              <pre className="text-xs text-green-300 font-mono whitespace-pre-wrap">{call.output}</pre>
            </div>
          )}
          {call.error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-2.5">
              <div className="text-[10px] text-red-500 mb-1 font-medium">Error</div>
              <pre className="text-xs text-red-300 font-mono whitespace-pre-wrap">{call.error}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ModelOutputPanel({
  results,
  selectedModelIndex,
  onSelectModel,
}: {
  results: EvaluationResult[];
  selectedModelIndex: number;
  onSelectModel: (i: number) => void;
}) {
  const result = results[selectedModelIndex];

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Cpu size={24} className="text-slate-600 mb-3" />
        <p className="text-sm text-slate-500">No model evaluation results for this problem.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Model selector */}
      <div className="border-b border-slate-800 p-4">
        <div className="text-[10px] text-slate-500 mb-2 uppercase tracking-wider">Select Model</div>
        <div className="flex flex-wrap gap-1.5">
          {results.map((r, i) => {
            const modelName = r.experiment?.model?.name?.replace('GPT-OSS-20B ', '') ?? `Model ${i + 1}`;
            return (
              <button
                key={r.id}
                onClick={() => onSelectModel(i)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  i === selectedModelIndex
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                }`}
              >
                {r.correct
                  ? <CheckCircle size={10} className="text-green-400" />
                  : <XCircle size={10} className="text-red-400" />}
                {modelName}
              </button>
            );
          })}
        </div>
      </div>

      {result && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-[10px] text-slate-500 mb-1">Final Answer</div>
              <div className={`text-sm font-bold font-mono ${result.correct ? 'text-green-400' : 'text-red-400'}`}>
                {result.prediction || '—'}
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-[10px] text-slate-500 mb-1">Correctness</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {result.correct
                  ? <><CheckCircle size={14} className="text-green-400" /><span className="text-xs text-green-400 font-medium">Correct</span></>
                  : <><XCircle size={14} className="text-red-400" /><span className="text-xs text-red-400 font-medium">Incorrect</span></>
                }
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-[10px] text-slate-500 mb-1">Latency</div>
              <div className="flex items-center gap-1.5">
                <Clock size={12} className="text-slate-400" />
                <span className="text-xs text-slate-300">{(result.latency_ms / 1000).toFixed(2)}s</span>
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-[10px] text-slate-500 mb-1">Tokens</div>
              <div className="flex items-center gap-1.5">
                <Hash size={12} className="text-slate-400" />
                <span className="text-xs text-slate-300">{result.token_count.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Tool calls */}
          {result.tool_calls.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Wrench size={12} className="text-violet-400" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Tool Calls ({result.tool_calls.length})</span>
              </div>
              <div className="space-y-2">
                {result.tool_calls.map((tc, i) => (
                  <ToolCallCard key={i} call={tc} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Reasoning */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={12} className="text-cyan-400" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Reasoning Trace</span>
              <span className="text-[10px] text-slate-700 ml-auto">{result.token_count} tokens</span>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-3 text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
              {result.reasoning}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProblemDetail({ problemId, onBack }: ProblemDetailProps) {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [results, setResults] = useState<EvaluationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState(0);

  useEffect(() => {
    Promise.all([fetchProblem(problemId), fetchResultsForProblem(problemId)])
      .then(([p, r]) => { setProblem(p); setResults(r); })
      .finally(() => setLoading(false));
  }, [problemId]);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size={24} /></div>;
  if (!problem) return <div className="p-8 text-sm text-slate-500">Problem not found.</div>;

  const difficultyVariant = (d: string): 'success' | 'warning' | 'error' => {
    if (d === 'easy') return 'success';
    if (d === 'medium') return 'warning';
    return 'error';
  };

  const correctCount = results.filter((r) => r.correct).length;
  const accuracy = results.length > 0 ? correctCount / results.length : null;

  // Insights
  const baseResult = results.find((r) => r.experiment?.model?.type === 'base');
  const sftResult = results.find((r) => r.experiment?.model?.type === 'sft');
  const sftDrift = baseResult?.correct && sftResult && !sftResult.correct;
  const baseWrong = !baseResult?.correct && sftResult?.correct;

  const insights: { label: string; value: string; variant: 'success' | 'warning' | 'info' | 'neutral' }[] = [];
  if (sftDrift) insights.push({ label: 'SFT Drift Detected', value: 'Base correct, SFT wrong', variant: 'warning' });
  if (baseWrong) insights.push({ label: 'SFT Improvement', value: 'SFT fixed base error', variant: 'success' });
  if (results.length > 0) {
    const tokenCounts = results.map((r) => r.token_count);
    const maxT = Math.max(...tokenCounts);
    const minT = Math.min(...tokenCounts);
    if (maxT - minT > 500) {
      insights.push({ label: 'Output Length Variance', value: `${minT}–${maxT} tokens`, variant: 'info' });
    }
  }
  const hasToolCalls = results.some((r) => r.tool_calls.length > 0);
  if (hasToolCalls) insights.push({ label: 'Tool Augmentation Used', value: 'Python execution detected', variant: 'info' });

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-slate-800 bg-slate-900/50 flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft size={14} /> Back
        </button>
        <span className="text-slate-700">/</span>
        <span className="text-xs text-slate-500">Problems</span>
        <span className="text-slate-700">/</span>
        <span className="text-xs font-mono text-slate-300">{problemId.slice(0, 8)}…</span>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant={difficultyVariant(problem.difficulty)}>{problem.difficulty}</Badge>
          {accuracy != null && (
            <Badge variant={accuracy >= 0.5 ? 'success' : 'error'}>
              {correctCount}/{results.length} models correct
            </Badge>
          )}
        </div>
      </div>

      {/* 3-column layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* LEFT: Problem info */}
        <div className="w-80 flex-shrink-0 border-r border-slate-800 overflow-y-auto bg-slate-900/30">
          <div className="p-5 space-y-5">
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Problem Information</div>
              <div className="space-y-2">
                {[
                  { label: 'ID', value: problem.id.slice(0, 13) + '…', mono: true },
                  { label: 'Dataset', value: problem.dataset },
                  { label: 'Subset', value: problem.subset, mono: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-start justify-between gap-2">
                    <span className="text-[10px] text-slate-500 min-w-14">{item.label}</span>
                    <span className={`text-[10px] text-right text-slate-300 ${item.mono ? 'font-mono' : ''}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Problem statement */}
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Problem Statement</div>
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-3 text-xs text-slate-200 leading-relaxed">
                {problem.problem_text}
              </div>
            </div>

            {/* Expected answer */}
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Expected Answer</div>
              <div className="bg-green-500/5 border border-green-500/25 rounded-lg p-3 flex items-center gap-2">
                <CheckCircle size={13} className="text-green-400 flex-shrink-0" />
                <span className="text-sm font-bold font-mono text-green-300">{problem.expected_answer}</span>
              </div>
            </div>

            {/* Reference solution */}
            {problem.reference_solution && (
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Reference Solution</div>
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-3 text-xs text-slate-400 leading-relaxed">
                  {problem.reference_solution}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CENTER: Model outputs */}
        <div className="flex-1 min-w-0 border-r border-slate-800 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
            <Cpu size={13} className="text-cyan-400" />
            <span className="text-xs font-semibold text-slate-200">Model Outputs</span>
            <span className="text-[10px] text-slate-600 ml-auto">{results.length} evaluation{results.length !== 1 ? 's' : ''}</span>
          </div>
          <ModelOutputPanel
            results={results}
            selectedModelIndex={selectedModel}
            onSelectModel={setSelectedModel}
          />
        </div>

        {/* RIGHT: Comparison summary */}
        <div className="w-72 flex-shrink-0 overflow-y-auto">
          <div className="p-4 space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={13} className="text-violet-400" />
                <span className="text-xs font-semibold text-slate-200">Comparison Summary</span>
              </div>

              {results.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-slate-800">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/80">
                        <th className="text-left px-2.5 py-2 text-[10px] text-slate-500">Model</th>
                        <th className="text-left px-2.5 py-2 text-[10px] text-slate-500">Answer</th>
                        <th className="px-2.5 py-2 text-[10px] text-slate-500">OK</th>
                        <th className="text-left px-2.5 py-2 text-[10px] text-slate-500">ms</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {results.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-800/30">
                          <td className="px-2.5 py-2 text-[10px] text-slate-300 truncate max-w-[70px]">
                            {r.experiment?.model?.name?.replace('GPT-OSS-20B ', '') ?? '—'}
                          </td>
                          <td className="px-2.5 py-2 font-mono text-[10px] text-slate-200">{r.prediction || '—'}</td>
                          <td className="px-2.5 py-2 text-center">
                            {r.correct
                              ? <CheckCircle size={11} className="text-green-400 mx-auto" />
                              : <XCircle size={11} className="text-red-400 mx-auto" />}
                          </td>
                          <td className="px-2.5 py-2 text-[10px] text-slate-500">{r.latency_ms}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-xs text-slate-600 text-center py-6 border border-slate-800 rounded-lg">
                  No evaluation results yet
                </div>
              )}
            </div>

            {/* Insights */}
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Analysis Insights</div>
              {insights.length > 0 ? (
                <div className="space-y-2">
                  {insights.map((ins, i) => (
                    <div key={i} className={`rounded-lg p-2.5 border text-xs ${
                      ins.variant === 'warning' ? 'bg-amber-500/5 border-amber-500/25 text-amber-300' :
                      ins.variant === 'success' ? 'bg-green-500/5 border-green-500/25 text-green-300' :
                      'bg-cyan-500/5 border-cyan-500/25 text-cyan-300'
                    }`}>
                      <div className="font-medium">{ins.label}</div>
                      <div className="text-[10px] opacity-70 mt-0.5">{ins.value}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-600 text-center py-4">No notable insights</div>
              )}
            </div>

            {/* Token comparison */}
            {results.length > 1 && (
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Token Count Comparison</div>
                <div className="space-y-2">
                  {results.map((r) => {
                    const maxTokens = Math.max(...results.map((x) => x.token_count), 1);
                    return (
                      <div key={r.id}>
                        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                          <span>{r.experiment?.model?.name?.replace('GPT-OSS-20B ', '') ?? '—'}</span>
                          <span className="font-mono">{r.token_count}</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-violet-500"
                            style={{ width: `${(r.token_count / maxTokens) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Accuracy summary */}
            {results.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                <div className="text-[10px] text-slate-500 mb-2">Overall Accuracy on this Problem</div>
                <div className="text-2xl font-bold text-slate-100">
                  {accuracy != null ? `${(accuracy * 100).toFixed(0)}%` : '—'}
                </div>
                <div className="text-[10px] text-slate-500">
                  {correctCount} of {results.length} models correct
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

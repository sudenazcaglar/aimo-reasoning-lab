import React, { useEffect, useState } from 'react';
import {
  Wrench, CheckCircle, XCircle, ChevronDown, ChevronRight,
  Clock, Terminal, AlertCircle, Filter, ChevronDownSquare
} from 'lucide-react';
import { fetchExperimentResults, fetchExperimentsWithLive } from '../lib/api';
import type { EvaluationResult, Experiment, ToolCall } from '../types';
import { Badge, CodeBlock, Spinner, EmptyState } from '../components/ui';

function AttemptTrace({ result }: { result: EvaluationResult }) {
  const [expanded, setExpanded] = useState(true);
  const [expandedTools, setExpandedTools] = useState<Set<number>>(new Set());

  const toggleTool = (i: number) => {
    setExpandedTools((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 bg-slate-900/80 hover:bg-slate-800/40 transition-colors text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-mono text-slate-400">
          1
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-200">Attempt #1</span>
            {result.correct
              ? <Badge variant="success">Correct</Badge>
              : <Badge variant="error">Incorrect</Badge>}
            {result.tool_calls.length > 0 && (
              <Badge variant="info">{result.tool_calls.length} tool call{result.tool_calls.length !== 1 ? 's' : ''}</Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-500">
            <span className="flex items-center gap-1"><Clock size={9} />{(result.latency_ms / 1000).toFixed(2)}s</span>
            <span>{result.token_count} tokens</span>
            <span className="font-mono">answer: <span className={result.correct ? 'text-green-400' : 'text-red-400'}>{result.prediction}</span></span>
          </div>
        </div>
        {expanded ? <ChevronDown size={14} className="text-slate-500 flex-shrink-0" /> : <ChevronRight size={14} className="text-slate-500 flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="border-t border-slate-800 p-4 space-y-4">
          {/* Tool calls timeline */}
          {result.tool_calls.length > 0 && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Tool Execution Timeline</div>
              <div className="relative pl-4">
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-slate-800" />
                <div className="space-y-3">
                  {result.tool_calls.map((call: ToolCall, i: number) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-5 top-3 w-2.5 h-2.5 rounded-full border-2 border-slate-950 bg-violet-500" />
                      <div className="border border-slate-700 rounded-lg overflow-hidden">
                        <button
                          className="w-full flex items-center gap-3 px-3 py-2.5 bg-slate-800/60 hover:bg-slate-800 text-left transition-colors"
                          onClick={() => toggleTool(i)}
                        >
                          <div className="w-5 h-5 rounded-md bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
                            <Wrench size={9} className="text-violet-400" />
                          </div>
                          <span className="text-xs font-medium text-slate-300">Python Execution #{i + 1}</span>
                          <span className="text-[10px] text-slate-600 ml-auto">{call.execution_time_ms}ms</span>
                          {call.error
                            ? <XCircle size={11} className="text-red-400" />
                            : <CheckCircle size={11} className="text-green-400" />}
                          {expandedTools.has(i)
                            ? <ChevronDown size={11} className="text-slate-500" />
                            : <ChevronRight size={11} className="text-slate-500" />}
                        </button>
                        {expandedTools.has(i) && (
                          <div className="p-3 bg-slate-900/60 space-y-2">
                            <CodeBlock language="python">{call.code}</CodeBlock>
                            {call.output && (
                              <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-2.5">
                                <div className="text-[10px] text-green-500 font-medium mb-1">stdout</div>
                                <pre className="text-xs text-green-300 font-mono whitespace-pre-wrap">{call.output}</pre>
                              </div>
                            )}
                            {call.error && (
                              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-2.5">
                                <div className="text-[10px] text-red-500 font-medium mb-1">error</div>
                                <pre className="text-xs text-red-300 font-mono whitespace-pre-wrap">{call.error}</pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Reasoning */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Terminal size={11} className="text-cyan-400" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Reasoning Output</span>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-3 text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
              {result.reasoning}
            </div>
          </div>

          {/* Final answer */}
          <div className={`rounded-lg border p-3 flex items-center gap-3 ${result.correct ? 'bg-green-500/5 border-green-500/25' : 'bg-red-500/5 border-red-500/25'}`}>
            {result.correct
              ? <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
              : <XCircle size={14} className="text-red-400 flex-shrink-0" />}
            <div>
              <div className="text-[10px] text-slate-500 mb-0.5">Final Answer</div>
              <span className={`text-sm font-bold font-mono ${result.correct ? 'text-green-300' : 'text-red-300'}`}>
                {result.prediction || '(none)'}
              </span>
            </div>
            <div className="ml-auto text-[10px] text-slate-500">
              expected: <span className="font-mono text-slate-300">{result.expected_answer}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ToolCallViewer() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [results, setResults] = useState<EvaluationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [selectedExpId, setSelectedExpId] = useState('');
  const [filterModel, setFilterModel] = useState<'all' | 'correct' | 'incorrect' | 'tool'>('all');

  useEffect(() => {
    fetchExperimentsWithLive()
      .then((e) => {
        const withTools = e.filter((x) => (x.config as { tool_use?: boolean }).tool_use);
        setExperiments(withTools.length > 0 ? withTools : e.slice(0, 3));
        if (withTools.length > 0) {
          setSelectedExpId(withTools[0].id);
        } else if (e.length > 0) {
          setSelectedExpId(e[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedExpId) return;
    setLoadingResults(true);
    fetchExperimentResults(selectedExpId)
      .then(setResults)
      .finally(() => setLoadingResults(false));
  }, [selectedExpId]);

  const filteredResults = results.filter((r) => {
    if (filterModel === 'correct') return r.correct;
    if (filterModel === 'incorrect') return !r.correct;
    if (filterModel === 'tool') return r.tool_calls.length > 0;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size={24} /></div>;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Tool Call Viewer</h1>
        <p className="text-sm text-slate-500 mt-1">Visualize agent execution traces with tool-augmented inference</p>
      </div>

      {/* Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <ChevronDownSquare size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <select
            value={selectedExpId}
            onChange={(e) => setSelectedExpId(e.target.value)}
            className="w-full appearance-none pl-8 pr-7 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60 cursor-pointer transition-colors"
          >
            {experiments.map((e) => (
              <option key={e.id} value={e.id}>{e.name} — {e.model?.name?.replace('GPT-OSS-20B ', '') ?? '?'}</option>
            ))}
          </select>
          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>

        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1 border border-slate-700">
          {([['all', 'All'], ['correct', 'Correct'], ['incorrect', 'Incorrect'], ['tool', 'With Tools']] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilterModel(val)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${filterModel === val ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Filter size={12} />
          <span>{filteredResults.length} results</span>
        </div>
      </div>

      {/* Results */}
      {loadingResults ? (
        <div className="flex items-center justify-center h-32"><Spinner size={20} /></div>
      ) : filteredResults.length === 0 ? (
        <EmptyState message="No results match the current filter" />
      ) : (
        <div className="space-y-4">
          {filteredResults.map((result) => (
            <div key={result.id}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-[10px] font-mono text-slate-600">{result.problem_id.slice(0, 8)}…</span>
                <span className="text-slate-700">·</span>
                <span className="text-[10px] text-slate-500">{result.problem?.subset ?? '—'}</span>
                <span className="text-slate-700">·</span>
                <span className="text-[10px] text-slate-500">expected: <span className="font-mono text-slate-300">{result.expected_answer}</span></span>
              </div>
              <AttemptTrace result={result} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

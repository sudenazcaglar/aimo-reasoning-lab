import React from 'react';
import { Cpu, Database, Globe, Key, Bell, Monitor, Code2 } from 'lucide-react';

export default function Settings() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Platform configuration and connection settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform info */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Monitor size={14} className="text-cyan-400" />
            <span className="text-sm font-semibold text-slate-200">Platform</span>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Application', value: 'AIMO Reasoning Lab' },
              { label: 'Version', value: 'v0.1.0-alpha' },
              { label: 'Build', value: 'Capstone 2025' },
              { label: 'Framework', value: 'React 18 + TypeScript' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                <span className="text-xs text-slate-500">{item.label}</span>
                <span className="text-xs font-mono text-slate-300">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Database */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Database size={14} className="text-cyan-400" />
            <span className="text-sm font-semibold text-slate-200">Database</span>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Provider', value: 'Supabase (PostgreSQL)' },
              { label: 'Region', value: 'us-east-1' },
              { label: 'Status', value: 'Connected' },
              { label: 'RLS', value: 'Enabled' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                <span className="text-xs text-slate-500">{item.label}</span>
                <span className={`text-xs font-mono ${item.value === 'Connected' ? 'text-green-400' : 'text-slate-300'}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Inference endpoints */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Cpu size={14} className="text-cyan-400" />
            <span className="text-sm font-semibold text-slate-200">Inference Endpoints</span>
          </div>
          <div className="space-y-2 mb-4">
            {[
              { label: 'Local vLLM', value: 'http://localhost:8000', status: 'not configured' },
              { label: 'HuggingFace TGI', value: 'Not set', status: 'not configured' },
              { label: 'Together AI', value: 'Not set', status: 'not configured' },
            ].map((ep) => (
              <div key={ep.label} className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded-lg border border-slate-700">
                <div>
                  <div className="text-xs text-slate-300">{ep.label}</div>
                  <div className="text-[10px] font-mono text-slate-600 mt-0.5">{ep.value}</div>
                </div>
                <span className="text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                  {ep.status}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-600">Configure endpoints to enable live model inference in Custom Solve.</p>
        </div>

        {/* API keys */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Key size={14} className="text-cyan-400" />
            <span className="text-sm font-semibold text-slate-200">API Keys</span>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Supabase Anon Key', masked: true },
              { label: 'HuggingFace Token', masked: false },
              { label: 'Together AI Key', masked: false },
              { label: 'OpenAI Key (optional)', masked: false },
            ].map((k) => (
              <div key={k.label} className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{k.label}</span>
                {k.masked ? (
                  <span className="text-[10px] font-mono text-green-400">●●●●●●●●●●●●</span>
                ) : (
                  <span className="text-[10px] text-slate-600 italic">not configured</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Experiment defaults */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Code2 size={14} className="text-cyan-400" />
          <span className="text-sm font-semibold text-slate-200">Default Experiment Configuration</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Max Tokens', value: '2048' },
            { label: 'Temperature', value: '0.0' },
            { label: 'Num Attempts', value: '1' },
            { label: 'Tool Use', value: 'Disabled' },
          ].map((c) => (
            <div key={c.label} className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs font-mono font-bold text-slate-200">{c.value}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{c.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* About */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Globe size={14} className="text-cyan-400" />
          <span className="text-sm font-semibold text-slate-200">About</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          AIMO Reasoning Lab is a capstone research platform for evaluating mathematical reasoning capabilities of
          open-source large language models. It supports AIME, AMC, MATH-500, and custom benchmark evaluation,
          experiment tracking, model comparison, and tool-augmented inference analysis.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {['React 18', 'TypeScript', 'Tailwind CSS', 'Supabase', 'Vite'].map((t) => (
            <span key={t} className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 border border-slate-700 text-slate-400">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

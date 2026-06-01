import React from 'react';
import {
  LayoutDashboard,
  FlaskConical,
  BookOpen,
  ListChecks,
  GitCompare,
  Terminal,
  Wrench,
  Settings,
  ChevronRight,
  Activity,
  Cpu,
} from 'lucide-react';
import type { Page } from '../types';

interface NavItem {
  id: Page;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'benchmarks', label: 'Benchmarks', icon: BookOpen },
  { id: 'problems', label: 'Problems', icon: ListChecks },
  { id: 'experiments', label: 'Experiments', icon: FlaskConical },
  { id: 'compare', label: 'Compare Models', icon: GitCompare },
  { id: 'custom-solve', label: 'Custom Solve', icon: Terminal },
  { id: 'tool-viewer', label: 'Tool Viewer', icon: Wrench },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface LayoutProps {
  currentPage: Page;
  onNavigate: (page: Page, id?: string) => void;
  activeBenchmark?: string;
  activeModel?: string;
  children: React.ReactNode;
}

export default function Layout({ currentPage, onNavigate, activeBenchmark, activeModel, children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Cpu size={16} className="text-cyan-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-100 leading-tight">AIMO</div>
              <div className="text-[10px] text-slate-500 leading-tight tracking-wide uppercase">Reasoning Lab</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id ||
              (item.id === 'benchmarks' && currentPage === 'benchmark-detail') ||
              (item.id === 'problems' && currentPage === 'problem-detail') ||
              (item.id === 'experiments' && currentPage === 'experiment-detail');
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                  active
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon size={16} className={active ? 'text-cyan-400' : 'text-slate-500'} />
                <span className="font-medium">{item.label}</span>
                {active && <ChevronRight size={12} className="ml-auto text-cyan-500/60" />}
              </button>
            );
          })}
        </nav>

        {/* Bottom status */}
        <div className="px-4 py-3 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Activity size={11} className="text-green-400" />
            <span>System Online</span>
          </div>
          <div className="text-[10px] text-slate-600 mt-0.5">v0.1.0-alpha · Capstone 2025</div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex-shrink-0 h-14 bg-slate-900/80 border-b border-slate-800 flex items-center px-6 gap-4 backdrop-blur">
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-slate-200 truncate">AIMO Reasoning Lab</h1>
            <p className="text-[10px] text-slate-500 truncate">Benchmark-Driven Evaluation Platform for Mathematical Reasoning Models</p>
          </div>

          <div className="flex items-center gap-3">
            {activeBenchmark && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700">
                <BookOpen size={11} className="text-violet-400" />
                <span className="text-xs text-slate-300">{activeBenchmark}</span>
              </div>
            )}
            {activeModel && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700">
                <Cpu size={11} className="text-cyan-400" />
                <span className="text-xs text-slate-300">{activeModel}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/10 border border-green-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400 font-medium">Ready</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

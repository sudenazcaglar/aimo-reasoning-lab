import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Benchmarks from './pages/Benchmarks';
import Problems from './pages/Problems';
import ProblemDetail from './pages/ProblemDetail';
import Experiments from './pages/Experiments';
import ModelComparison from './pages/ModelComparison';
import CustomSolve from './pages/CustomSolve';
import ToolCallViewer from './pages/ToolCallViewer';
import Settings from './pages/Settings';
import type { Page } from './types';

interface NavState {
  page: Page;
  selectedId?: string;
}

export default function App() {
  const [nav, setNav] = useState<NavState>({ page: 'dashboard' });

  const navigate = (page: Page, id?: string) => {
    const resolved: Page =
      page === 'benchmarks' && id ? 'benchmark-detail' :
      page === 'problems' && id ? 'problem-detail' :
      page === 'experiments' && id ? 'experiment-detail' :
      page;
    setNav({ page: resolved, selectedId: id });
  };

  const goBack = () => {
    if (nav.page === 'benchmark-detail') setNav({ page: 'benchmarks' });
    else if (nav.page === 'problem-detail') setNav({ page: 'problems' });
    else if (nav.page === 'experiment-detail') setNav({ page: 'experiments' });
    else setNav({ page: 'dashboard' });
  };

  const sidebarPage: Page =
    nav.page === 'benchmark-detail' ? 'benchmarks' :
    nav.page === 'problem-detail' ? 'problems' :
    nav.page === 'experiment-detail' ? 'experiments' :
    nav.page;

  const handleSidebarNav = (page: Page) => {
    setNav({ page });
  };

  return (
    <Layout
      currentPage={sidebarPage}
      onNavigate={handleSidebarNav}
    >
      {nav.page === 'dashboard' && (
        <Dashboard
          onNavigate={(page, id) => navigate(page, id)}
        />
      )}
      {(nav.page === 'benchmarks' || nav.page === 'benchmark-detail') && (
        <Benchmarks
          selectedId={nav.page === 'benchmark-detail' ? nav.selectedId : undefined}
          onSelectBenchmark={(id) => setNav({ page: 'benchmark-detail', selectedId: id })}
          onBack={goBack}
          onNavigateExperiment={(id) => setNav({ page: 'experiment-detail', selectedId: id })}
        />
      )}
      {nav.page === 'problems' && (
        <Problems
          onSelectProblem={(id) => setNav({ page: 'problem-detail', selectedId: id })}
        />
      )}
      {nav.page === 'problem-detail' && nav.selectedId && (
        <ProblemDetail
          problemId={nav.selectedId}
          onBack={goBack}
        />
      )}
      {(nav.page === 'experiments' || nav.page === 'experiment-detail') && (
        <Experiments
          selectedId={nav.page === 'experiment-detail' ? nav.selectedId : undefined}
          onSelectExperiment={(id) => setNav({ page: 'experiment-detail', selectedId: id })}
          onBack={goBack}
          onSelectProblem={(id) => setNav({ page: 'problem-detail', selectedId: id })}
        />
      )}
      {nav.page === 'compare' && <ModelComparison />}
      {nav.page === 'custom-solve' && <CustomSolve />}
      {nav.page === 'tool-viewer' && <ToolCallViewer />}
      {nav.page === 'settings' && <Settings />}
    </Layout>
  );
}

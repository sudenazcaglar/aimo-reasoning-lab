import type {
  Model,
  Benchmark,
  Problem,
  Experiment,
  EvaluationResult,
} from "../types";

const LIVE_API_BASE =
  import.meta.env.VITE_AIMO_API_BASE ??
  "https://monsoon-chevy-democracy.ngrok-free.dev";

async function loadJson<T>(path: string): Promise<T> {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }

  return response.json();
}

async function loadLiveJson<T>(path: string): Promise<T> {
  const base = LIVE_API_BASE.replace(/\/$/, "");

  const response = await fetch(`${base}${path}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "ngrok-skip-browser-warning": "true",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load live API ${path}: ${response.status}`);
  }

  const text = await response.text();

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Live API returned non-JSON response for ${path}`);
  }
}

export async function fetchModels(): Promise<Model[]> {
  return loadJson<Model[]>("/data/models.json");
}

export async function fetchBenchmarks(): Promise<Benchmark[]> {
  return loadJson<Benchmark[]>("/data/benchmarks.json");
}

export async function fetchBenchmark(id: string): Promise<Benchmark | null> {
  const benchmarks = await fetchBenchmarks();
  return benchmarks.find((b) => b.id === id) ?? null;
}

export async function fetchProblems(filters?: {
  benchmark_id?: string;
  subset?: string;
  difficulty?: string;
}): Promise<Problem[]> {
  let problems = await loadJson<Problem[]>(
    "/data/problems/comp_math_24_25.json",
  );

  if (filters?.benchmark_id) {
    problems = problems.filter((p) => p.benchmark_id === filters.benchmark_id);
  }

  if (filters?.subset) {
    problems = problems.filter((p) => p.subset === filters.subset);
  }

  if (filters?.difficulty) {
    problems = problems.filter((p) => p.difficulty === filters.difficulty);
  }

  return problems;
}

export async function fetchProblem(id: string): Promise<Problem | null> {
  const problems = await fetchProblems();
  return problems.find((p) => p.id === id) ?? null;
}

export async function fetchExperiments(): Promise<Experiment[]> {
  return loadJson<Experiment[]>("/data/experiments.json");
}

export async function fetchExperimentsWithLive(): Promise<Experiment[]> {
  const staticExperiments = await loadJson<Experiment[]>("/data/experiments.json");

  try {
    const liveExperiments = await loadLiveJson<Experiment[]>("/experiments");
    return [...liveExperiments, ...staticExperiments];
  } catch {
    return staticExperiments;
  }
}

export async function fetchExperiment(id: string): Promise<Experiment | null> {
  try {
    const liveExperiment = await fetchLiveExperiment(id);
    if (liveExperiment && liveExperiment.id) {
      return liveExperiment;
    }
  } catch {
    // not a live experiment, continue with static lookup
  }

  const experiments = await fetchExperimentsWithLive();
  return experiments.find((e) => e.id === id) ?? null;
}

export async function fetchExperimentResults(
  experimentId: string,
): Promise<EvaluationResult[]> {
  try {
    const liveResults = await loadLiveJson<EvaluationResult[]>(
      `/results/${experimentId}`,
    );

    if (Array.isArray(liveResults)) {
      return liveResults;
    }
  } catch {
    // not live, continue with static file
  }

  return loadJson<EvaluationResult[]>(`/data/results/${experimentId}.json`);
}

export async function fetchResultsForProblem(
  problemId: string,
): Promise<EvaluationResult[]> {
  const experiments = await fetchExperiments();

  let results: EvaluationResult[] = [];

  for (const experiment of experiments) {
    try {
      const experimentResults = await fetchExperimentResults(experiment.id);

      results.push(
        ...experimentResults.filter((r) => r.problem_id === problemId),
      );
    } catch {
      // ignore missing result files
    }
  }

  return results;
}

export type SolveConfig = {
  model: string;
  attempts: number;
  max_tokens: number;
  tool_use: boolean;
};

export type SolveJob = {
  id: string;
  type: "custom_solve";
  name: string;
  status: "queued" | "running" | "completed" | "error" | "not_found";
  created_at?: string;
  started_at?: string;
  finished_at?: string;
  problem?: string;
  config?: SolveConfig;
  answer?: number | string | null;
  result?: EvaluationResult | null;
  error?: string | null;
};

export async function createSolveJob(
  problem: string,
  config: SolveConfig,
): Promise<SolveJob> {
  const base = LIVE_API_BASE.replace(/\/$/, "");

  const response = await fetch(`${base}/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify({ problem, config }),
  });

  if (!response.ok) {
    throw new Error("Failed to create solve job");
  }

  return response.json();
}

export async function fetchSolveJob(jobId: string): Promise<SolveJob> {
  return loadLiveJson<SolveJob>(`/jobs/${jobId}`);
}

export async function fetchSolveJobs(): Promise<SolveJob[]> {
  return loadLiveJson<SolveJob[]>("/jobs");
}

export type LiveExperimentRequest = {
  name: string;
  benchmark_id: string;
  benchmark_name: string;
  problems: Array<{
    id: string;
    problem?: string;
    statement?: string;
    expected_answer?: string | number | null;
    subset?: string;
  }>;
  config: SolveConfig;
};

export async function createLiveExperiment(
  payload: LiveExperimentRequest,
): Promise<Experiment> {
  const base = LIVE_API_BASE.replace(/\/$/, "");

  const response = await fetch(`${base}/experiments/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to create live experiment");
  }

  return response.json();
}

export async function fetchLiveExperiment(id: string): Promise<Experiment> {
  return loadLiveJson<Experiment>(`/experiments/${id}`);
}

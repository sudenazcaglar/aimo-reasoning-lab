import type {
  Model,
  Benchmark,
  Problem,
  Experiment,
  EvaluationResult,
} from "../types";

async function loadJson<T>(path: string): Promise<T> {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }

  return response.json();
}

export async function fetchModels(): Promise<Model[]> {
  return loadJson<Model[]>("/data/models.json");
}

export async function fetchBenchmarks(): Promise<Benchmark[]> {
  return loadJson<Benchmark[]>("/data/benchmarks.json");
}

export async function fetchBenchmark(
  id: string
): Promise<Benchmark | null> {
  const benchmarks = await fetchBenchmarks();
  return benchmarks.find((b) => b.id === id) ?? null;
}

export async function fetchProblems(filters?: {
  benchmark_id?: string;
  subset?: string;
  difficulty?: string;
}): Promise<Problem[]> {
  let problems = await loadJson<Problem[]>(
    "/data/problems/comp_math_24_25.json"
  );

  if (filters?.benchmark_id) {
    problems = problems.filter(
      (p) => p.benchmark_id === filters.benchmark_id
    );
  }

  if (filters?.subset) {
    problems = problems.filter(
      (p) => p.subset === filters.subset
    );
  }

  if (filters?.difficulty) {
    problems = problems.filter(
      (p) => p.difficulty === filters.difficulty
    );
  }

  return problems;
}

export async function fetchProblem(
  id: string
): Promise<Problem | null> {
  const problems = await fetchProblems();
  return problems.find((p) => p.id === id) ?? null;
}

export async function fetchExperiments(): Promise<Experiment[]> {
  return loadJson<Experiment[]>(
    "/data/experiments.json"
  );
}

export async function fetchExperiment(
  id: string
): Promise<Experiment | null> {
  const experiments = await fetchExperiments();
  return experiments.find((e) => e.id === id) ?? null;
}

export async function fetchExperimentResults(
  experimentId: string
): Promise<EvaluationResult[]> {
  return loadJson<EvaluationResult[]>(
    `/data/results/${experimentId}.json`
  );
}

export async function fetchResultsForProblem(
  problemId: string
): Promise<EvaluationResult[]> {
  const experiments = await fetchExperiments();

  let results: EvaluationResult[] = [];

  for (const experiment of experiments) {
    try {
      const experimentResults =
        await fetchExperimentResults(experiment.id);

      results.push(
        ...experimentResults.filter(
          (r) => r.problem_id === problemId
        )
      );
    } catch {
      // ignore missing result files
    }
  }

  return results;
}

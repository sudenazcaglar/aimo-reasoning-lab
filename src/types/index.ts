export interface Model {
  id: string;
  name: string;
  type: 'base' | 'sft' | 'rlhf' | 'tool-aug';
  base_model: string;
  adapter_path: string | null;
  description: string;
  created_at: string;
}

export interface Benchmark {
  id: string;
  name: string;
  slug: string;
  description: string;
  problem_count: number;
  subsets: string[];
  created_at: string;
}

export interface Problem {
  id: string;
  benchmark_id: string;
  dataset: string;
  subset: string;
  difficulty: 'easy' | 'medium' | 'hard';
  problem_text: string;
  expected_answer: string;
  reference_solution: string;
  created_at: string;
  benchmark?: Benchmark;
}

export interface ExperimentConfig {
  max_tokens: number;
  temperature: number;
  num_attempts: number;
  tool_use: boolean;
}

export interface ExperimentMetrics {
  accuracy: number;
  avg_latency_ms: number;
  avg_token_count: number;
  correct: number;
  incorrect: number;
  tool_errors: number;
  formatting_errors: number;
}

export interface Experiment {
  id: string;
  name: string;
  model_id: string;
  benchmark_id: string;
  config: ExperimentConfig;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  finished_at: string | null;
  metrics: ExperimentMetrics | Record<string, never>;
  created_at: string;
  model?: Model;
  benchmark?: Benchmark;
}

export interface ToolCall {
  type: 'python' | 'wolfram' | 'search';
  code: string;
  output: string;
  error: string | null;
  execution_time_ms: number;
}

export interface EvaluationResult {
  id: string;
  experiment_id: string;
  problem_id: string;
  prediction: string;
  expected_answer: string;
  correct: boolean;
  reasoning: string;
  latency_ms: number;
  token_count: number;
  tool_calls: ToolCall[];
  created_at: string;
  problem?: Problem;
  experiment?: Experiment;
}

export type Page =
  | 'dashboard'
  | 'benchmarks'
  | 'benchmark-detail'
  | 'problems'
  | 'problem-detail'
  | 'experiments'
  | 'experiment-detail'
  | 'compare'
  | 'custom-solve'
  | 'tool-viewer'
  | 'settings';

import fs from "fs";
import path from "path";

const inputPath = path.join("raw-data", "comp_math_24_25.jsonl");

const outputDir = path.join("public", "data", "problems");
const outputPath = path.join(outputDir, "comp_math_24_25.json");

function inferDifficulty(index) {
  if (index < 80) return "easy";
  if (index < 180) return "medium";
  return "hard";
}

const lines = fs
  .readFileSync(inputPath, "utf8")
  .split("\n")
  .filter((x) => x.trim());

const problems = lines.map((line, index) => {
  const outerRow = JSON.parse(line);

  const row =
    typeof outerRow.problem === "string"
      ? JSON.parse(outerRow.problem)
      : outerRow;

  return {
    id: row.id,
    benchmark_id: "comp_math_24_25",
    dataset: "Comp-Math-24-25",
    subset: row.subset_for_metrics ?? "unknown",
    difficulty: inferDifficulty(index),
    problem_text: row.problem,
    expected_answer: String(row.expected_answer),
    reference_solution: row.reference_solution ?? "",
    created_at: "2026-05-25T00:00:00Z"
  };
});

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(problems, null, 2));

console.log(`Converted ${problems.length} problems`);
console.log(`Saved to ${outputPath}`);

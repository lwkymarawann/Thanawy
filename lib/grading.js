// Percentage/letter thresholds — edit this table to match your school's exact scale.
export const GRADE_SCALE = [
  { min: 90, letter: "A+" },
  { min: 85, letter: "A" },
  { min: 80, letter: "A-" },
  { min: 75, letter: "B+" },
  { min: 70, letter: "B" },
  { min: 65, letter: "B-" },
  { min: 60, letter: "C+" },
  { min: 55, letter: "C" },
  { min: 50, letter: "D" },
  { min: 0, letter: "F" },
];

export function percentage(score, max) {
  if (score === null || score === undefined || score === "") return null;
  if (!max || Number(max) <= 0) return null;
  const pct = (Number(score) / Number(max)) * 100;
  if (Number.isNaN(pct)) return null;
  return Math.round(pct * 10) / 10;
}

export function letterGrade(pct) {
  if (pct === null || pct === undefined) return "—";
  for (const band of GRADE_SCALE) {
    if (pct >= band.min) return band.letter;
  }
  return "F";
}

// Weighted average percentage across a subject's exams that have a score entered.
export function subjectAverage(exams) {
  const scored = exams.filter(
    (e) => e.score !== null && e.score !== undefined && e.score !== ""
  );
  if (scored.length === 0) return null;
  let totalWeight = 0;
  let totalWeighted = 0;
  for (const e of scored) {
    const pct = percentage(e.score, e.maxScore);
    if (pct === null) continue;
    const weight = Number(e.weight) > 0 ? Number(e.weight) : 1;
    totalWeighted += pct * weight;
    totalWeight += weight;
  }
  if (totalWeight === 0) return null;
  return Math.round((totalWeighted / totalWeight) * 10) / 10;
}

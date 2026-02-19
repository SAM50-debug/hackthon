// FILE: src/utils/analytics.js

/**
 * Constants for Scoring & Analytics
 */
const BASE_SCORE = 100;
const PENALTY_INSTABILITY_FACTOR = 50; // unstableRatio * 50
const PENALTY_ASYMMETRY_FACTOR = 20; // (asymmetryScore - 1) * 20
const TEMPO_FAST_THRESHOLD = 0.8; // seconds
const TEMPO_SLOW_THRESHOLD = 4.5; // seconds
const DEDUCTION_TOO_FAST = 15;
const DEDUCTION_TOO_SLOW = 10;
const MAX_TOTAL_DEDUCTION = 90; // min score = 10

const FATIGUE_MIN_REPS = 4;
const FATIGUE_THRESHOLD_MILD = 0.02;
const FATIGUE_THRESHOLD_HIGH = 0.06;

/**
 * 1) Compute Rep Score (Pure Function)
 */
export function computeRepScore({
  peakHeightDiff,
  unstableFrameCount,
  totalFrames,
  durationSec,
  margin,
}) {
  const safeMargin = Math.max(Number(margin) || 0, 1e-6);
  const safeFrames = Math.max(Number(totalFrames) || 0, 1);

  const rawAsymmetryScore = (Number(peakHeightDiff) || 0) / safeMargin;
  const asymmetryScore = Math.min(3, Math.max(0, rawAsymmetryScore));

  const rawUnstableRatio = (Number(unstableFrameCount) || 0) / safeFrames;
  const unstableRatio = Math.min(1, Math.max(0, rawUnstableRatio));

  const instabilityPenalty = unstableRatio * PENALTY_INSTABILITY_FACTOR;

  let asymmetryPenalty = 0;
  if (asymmetryScore > 1.0) {
    asymmetryPenalty = (asymmetryScore - 1.0) * PENALTY_ASYMMETRY_FACTOR;
  }

  let tempoPenalty = 0;
  if (Number.isFinite(durationSec)) {
    if (durationSec < TEMPO_FAST_THRESHOLD) tempoPenalty = DEDUCTION_TOO_FAST;
    else if (durationSec > TEMPO_SLOW_THRESHOLD) tempoPenalty = DEDUCTION_TOO_SLOW;
  }

  const totalDeduction = Math.min(
    MAX_TOTAL_DEDUCTION,
    instabilityPenalty + asymmetryPenalty + tempoPenalty
  );

  const score = Math.max(10, Math.round(BASE_SCORE - totalDeduction));

  // Tie-breaker: INSTABILITY > ASYMMETRY > TEMPO
  let dominant = "NONE";
  const maxDed = Math.max(instabilityPenalty, asymmetryPenalty, tempoPenalty);
  if (maxDed > 0) {
    if (maxDed === instabilityPenalty) dominant = "INSTABILITY";
    else if (maxDed === asymmetryPenalty) dominant = "ASYMMETRY";
    else dominant = "TEMPO";
  }

  return {
    score,
    durationSec, // ✅ required downstream
    deductions: { instabilityPenalty, asymmetryPenalty, tempoPenalty },
    raw: { unstableRatio, asymmetryScore },
    dominant,
  };
}

function calculateSlope(values) {
  const n = values.length;
  if (n < 2) return 0;

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    const y = Number(values[i]) || 0;
    sumX += i;
    sumY += y;
    sumXY += i * y;
    sumXX += i * i;
  }
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}

/**
 * 2) Fatigue Trend
 */
export function computeFatigueTrend(repScores) {
  if (!repScores || repScores.length < FATIGUE_MIN_REPS) {
    return { trend: "STABLE", fatigueMetric: 0, slopes: null };
  }

  const scores = repScores.map((r) => Number(r.score) || 0);
  const asymmetry = repScores.map((r) => Number(r?.raw?.asymmetryScore) || 0);
  const instability = repScores.map((r) => Number(r?.raw?.unstableRatio) || 0);

  const scoreSlope = calculateSlope(scores);
  const asymmetrySlope = calculateSlope(asymmetry);
  const instabilitySlope = calculateSlope(instability);

  const fatigueMetric = (asymmetrySlope + instabilitySlope) - scoreSlope;

  let trend = "STABLE";
  if (fatigueMetric >= FATIGUE_THRESHOLD_HIGH) trend = "HIGH_FATIGUE";
  else if (fatigueMetric >= FATIGUE_THRESHOLD_MILD) trend = "MILD_FATIGUE";

  return {
    trend,
    fatigueMetric,
    slopes: { score: scoreSlope, asymmetry: asymmetrySlope, instability: instabilitySlope },
  };
}

/**
 * 3) Session Summary Engine
 */
export function sessionSummaryEngine(session) {
  const repScores = Array.isArray(session?.repScores) ? session.repScores : [];
  const fatigue = session?.fatigue;

  if (repScores.length === 0) {
    return "Session incomplete. Perform more repetitions to generate detailed feedback.";
  }

  const faultCounts = { ASYMMETRY: 0, INSTABILITY: 0, TEMPO: 0 };
  let fastReps = 0;
  let slowReps = 0;

  for (const r of repScores) {
    if (r?.dominant && r.dominant !== "NONE") faultCounts[r.dominant]++;
    if (Number.isFinite(r?.durationSec)) {
      if (r.durationSec < TEMPO_FAST_THRESHOLD) fastReps++;
      if (r.durationSec > TEMPO_SLOW_THRESHOLD) slowReps++;
    }
  }

  const totalReps = repScores.length;

  let opening = "Session started with solid form.";
  let mid = "";
  let closing = "Overall consistency was good.";
  let recommendation = "Maintain this focus for next time.";

  if (fatigue?.trend === "HIGH_FATIGUE") {
    opening = "Session started stable but performance degraded noticeably near the end.";
    mid = "Fatigue detected: instability and asymmetry increased over time.";
    recommendation = "Reduce volume slightly and prioritize clean reps.";
  } else if (fatigue?.trend === "MILD_FATIGUE") {
    mid = "Minor fatigue signs appeared towards the end.";
  }

  const dominantFault = Object.keys(faultCounts).reduce((a, b) =>
    faultCounts[a] > faultCounts[b] ? a : b
  );

  if (faultCounts[dominantFault] > totalReps * 0.3) {
    if (dominantFault === "ASYMMETRY") {
      mid = "Asymmetry was the dominant issue, suggesting a left-right imbalance.";
      recommendation = "Add unilateral work and slow down to match both sides.";
    } else if (dominantFault === "INSTABILITY") {
      mid = "Instability events were frequent, showing loss of control during the motion.";
      recommendation = "Use slower reps and brief holds at the top for stability.";
    } else if (dominantFault === "TEMPO") {
      if (fastReps > slowReps) {
        mid = "Tempo was frequently too fast, reducing control.";
        recommendation = "Slow the lowering phase to ~2 seconds.";
      } else {
        mid = "Tempo was inconsistent with pauses or slowdowns.";
        recommendation = "Aim for smooth continuous motion.";
      }
    }
  }

  const avgScore =
    repScores.reduce((sum, r) => sum + (Number(r.score) || 0), 0) / totalReps;

  if (avgScore > 92 && fatigue?.trend === "STABLE") {
    return `Excellent session. Avg score ${Math.round(avgScore)} shows high consistency. Stability stayed inside the calibrated margin. Increase volume or difficulty for progressive overload.`;
  }

  const parts = [opening, mid, closing, recommendation].filter(Boolean);
  const uniqueParts = [...new Set(parts)];
  return uniqueParts.join(" ");
}
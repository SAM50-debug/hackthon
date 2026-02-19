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
const MAX_TOTAL_DEDUCTION = 90; // Score cannot be < 10

const FATIGUE_MIN_REPS = 4;
const FATIGUE_THRESHOLD_MILD = 0.02;
const FATIGUE_THRESHOLD_HIGH = 0.06;

/**
 * 1. Compute Rep Score (Pure Function)
 * Normalize & score a single repetition based on biomechanical metrics.
 */
export function computeRepScore({
  peakHeightDiff,
  unstableFrameCount,
  totalFrames,
  durationSec,
  margin,
}) {
  // 1. Normalization
  // Asymmetry: Ratio relative to margin (e.g., 1.5x allowed margin).
  // Clamp 0 -> 3 to prevent outliers destroying the math.
  const safeMargin = Math.max(margin, 0.000001);
  const rawAsymmetryScore = peakHeightDiff / safeMargin;
  const asymmetryScore = Math.min(3, Math.max(0, rawAsymmetryScore));

  // Instability: Ratio of frames flagged as unstable.
  // Clamp 0 -> 1.
  const safeFrames = Math.max(totalFrames, 1);
  const rawUnstableRatio = unstableFrameCount / safeFrames;
  const unstableRatio = Math.min(1, Math.max(0, rawUnstableRatio));

  // 2. Calculate Deductions
  let instabilityPenalty = unstableRatio * PENALTY_INSTABILITY_FACTOR;
  
  let asymmetryPenalty = 0;
  if (asymmetryScore > 1.0) {
    asymmetryPenalty = (asymmetryScore - 1.0) * PENALTY_ASYMMETRY_FACTOR;
  }

  let tempoPenalty = 0;
  // Safe check for durationSec
  if (Number.isFinite(durationSec)) {
    if (durationSec < TEMPO_FAST_THRESHOLD) {
      tempoPenalty = DEDUCTION_TOO_FAST;
    } else if (durationSec > TEMPO_SLOW_THRESHOLD) {
      tempoPenalty = DEDUCTION_TOO_SLOW;
    }
  }

  // 3. Apply Penalties & Clamp
  // Max deduction is 90, so min score is 10.
  const totalDeduction = Math.min(
    MAX_TOTAL_DEDUCTION,
    instabilityPenalty + asymmetryPenalty + tempoPenalty
  );
  
  const score = Math.max(10, Math.round(BASE_SCORE - totalDeduction));

  // 4. Determine Dominant Fault
  // Priority Tie-breaker: INSTABILITY > ASYMMETRY > TEMPO
  let dominant = "NONE";
  const maxDed = Math.max(instabilityPenalty, asymmetryPenalty, tempoPenalty);
  
  if (maxDed > 0) {
      if (maxDed === instabilityPenalty) {
          dominant = "INSTABILITY";
      } else if (maxDed === asymmetryPenalty) {
          dominant = "ASYMMETRY";
      } else if (maxDed === tempoPenalty) {
          dominant = "TEMPO";
      }
  }

  return {
    score,
    deductions: {
      instabilityPenalty,
      asymmetryPenalty,
      tempoPenalty,
    },
    raw: {
      unstableRatio,
      asymmetryScore,
    },
    dominant,
  };
}

/**
 * Helper: Simple Linear Regression Slope (O(n))
 */
function calculateSlope(values) {
  const n = values.length;
  if (n < 2) return 0;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumXX += i * i;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return 0;

  return (n * sumXY - sumX * sumY) / denominator;
}

/**
 * 2. Compute Fatigue Trend (Pure Function)
 * Detect performance degradation over time using multi-variable regression.
 * Assumption: Uses rep index (0, 1, 2...) as the x-axis (even spacing).
 */
export function computeFatigueTrend(repScores) {
  // Need at least 4 reps to establish a meaningful trend
  if (!repScores || repScores.length < FATIGUE_MIN_REPS) {
    return {
      trend: "STABLE",
      fatigueMetric: 0,
      slopes: null,
    };
  }

  // Extract series
  // Note: repScores is expected to be ordered [rep1, rep2, ...]
  const scores = repScores.map((r) => r.score);
  const asymmetry = repScores.map((r) => r.raw.asymmetryScore);
  const instability = repScores.map((r) => r.raw.unstableRatio);

  const scoreSlope = calculateSlope(scores);         // Neg = failing
  const asymmetrySlope = calculateSlope(asymmetry);  // Pos = failing
  const instabilitySlope = calculateSlope(instability); // Pos = failing

  // Composite Metric:
  // Rising Asymmetry (+) + Rising Instability (+) - Falling Score (-)
  // Since falling score is negative, subtracting it adds to the fatigue metric.
  const fatigueMetric = (asymmetrySlope + instabilitySlope) - scoreSlope;

  let trend = "STABLE";
  if (fatigueMetric >= FATIGUE_THRESHOLD_HIGH) {
    trend = "HIGH_FATIGUE";
  } else if (fatigueMetric >= FATIGUE_THRESHOLD_MILD) {
    trend = "MILD_FATIGUE";
  }

  return {
    trend,
    fatigueMetric,
    slopes: {
      score: scoreSlope,
      asymmetry: asymmetrySlope,
      instability: instabilitySlope,
    },
  };
}

/**
 * 3. Session Summary Engine (Pure Function)
 * Deterministic rule-based feedback generation.
 */
export function sessionSummaryEngine(session) {
  const { fatigue, repScores } = session;
  
  // Fallback for empty/short sessions
  if (!repScores || repScores.length === 0) {
    return "Session incomplete. Perform more repetitions to generate detailed feedback.";
  }

  // 1. Analyze Dominant Failures across all reps
  const faultCounts = {
    ASYMMETRY: 0,
    INSTABILITY: 0,
    TEMPO: 0,
  };
  
  let fastReps = 0;
  let slowReps = 0;

  repScores.forEach((r) => {
    if (r.dominant !== "NONE") faultCounts[r.dominant]++;
    
    // Only analyze tempo if duration is valid and finite
    if (Number.isFinite(r.durationSec)) {
        if (r.durationSec < TEMPO_FAST_THRESHOLD) fastReps++;
        if (r.durationSec > TEMPO_SLOW_THRESHOLD) slowReps++;
    }
  });

  const totalReps = repScores.length;
  
  // 2. Establish Narrative Parts
  let opening = "Session started with solid form.";
  let mid = "";
  let closing = "Overall consistency was good.";
  let recommendation = "Maintain this focus for next time.";

  // A. Check Fatigue First (High Priority)
  if (fatigue?.trend === "HIGH_FATIGUE") {
    opening = "Session started stable but performance notably degraded in the final third.";
    mid = "Analysis detects a fatigue pattern characterized by rising instability and asymmetry.";
    recommendation = "Consider reducing rep volume to prioritize quality over quantity.";
  } 
  else if (fatigue?.trend === "MILD_FATIGUE") {
    mid = "Minor signs of fatigue appeared towards the end, with slight loss of motor control.";
  }

  // B. Dominant Failure Mode (if not purely fatigue)
  const dominantFault = Object.keys(faultCounts).reduce((a, b) => 
    faultCounts[a] > faultCounts[b] ? a : b
  );
  
  // Only mention if significant (> 30% of reps)
  if (faultCounts[dominantFault] > totalReps * 0.3) {
    if (dominantFault === "ASYMMETRY") {
      mid = "Consistent bilateral asymmetry was detected, suggesting a range-of-motion imbalance.";
      recommendation = "Focus on unilateral exercises to correct the weaker side.";
    } else if (dominantFault === "INSTABILITY") {
      mid = "High baseline variance detected. The rolling stability window triggered frequently.";
      recommendation = "Lower the weight and use static holds to improve stabilizer recruitment.";
    } else if (dominantFault === "TEMPO") {
      if (fastReps > slowReps) {
        mid = "Repetition cadence was frequently too fast, reducing muscle activation.";
        recommendation = "Slow down the eccentric (lowering) phase to at least 2 seconds.";
      } else {
        mid = "Movement speed was inconsistent, with several pauses detected.";
        recommendation = "Try to maintain a continuous, fluid motion without stopping.";
      }
    }
  }

  // C. Perfect Session Override
  const avgScore = repScores.reduce((sum, r) => sum + r.score, 0) / totalReps;
  if (avgScore > 92 && fatigue?.trend === "STABLE") {
    return `Excellent session with high consistency. Average score of ${Math.round(avgScore)} indicates professional-level control. Stability metrics remained within the calibrated margin throughout. Increase load or volume for progressive overload.`;
  }

  // Assemble
  const parts = [opening, mid, closing, recommendation].filter(s => s !== "");
  
  // Safer Deduplication: Only remove exact duplicates, verify punctuation
  const uniqueParts = [...new Set(parts)];
  return uniqueParts.join(" ");
}

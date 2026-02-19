// FILE: src/utils/scoring.js
export function clampScore(n) {
  return Math.max(0, Math.min(100, n));
}

export function getDurationSec(startedAtMs, endedAtMs) {
  if (!startedAtMs || !endedAtMs) return 0;
  return Math.max(0, Math.round((endedAtMs - startedAtMs) / 1000));
}

/**
 * Duration-normalized scoring:
 * badRate = (badFrames + unstableFrames*w) / durationSec
 */
export function computeSessionScore({ badFrames, unstableFrames = 0, durationSec }) {
  if (!durationSec || durationSec <= 0) return 0;

  const unstableWeight = 0.6; // tweak
  const badRate = (badFrames + unstableFrames * unstableWeight) / durationSec;

  const score = 100 - badRate * 30;
  return clampScore(Math.round(score));
}

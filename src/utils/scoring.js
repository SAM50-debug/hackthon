export function clampScore(n) {
  return Math.max(0, Math.min(100, n));
}

export function getDurationSec(startedAtMs, endedAtMs) {
  if (!startedAtMs || !endedAtMs) return 0;
  return Math.max(0, Math.round((endedAtMs - startedAtMs) / 1000));
}

/**
 * Duration-normalized scoring:
 * badRate = badFrames / durationSec
 * 0 bad/sec => 100
 * ~1 bad/sec => ~70 (tunable)
 */
export function computeSessionScore({ badFrames, durationSec }) {
  if (!durationSec || durationSec <= 0) return 0;

  const badRate = badFrames / durationSec;
  const score = 100 - badRate * 30;

  return clampScore(Math.round(score));
}

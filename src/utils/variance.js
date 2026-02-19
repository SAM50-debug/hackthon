// FILE: src/utils/variance.js

export function computeStdDev(values) {
  if (!values || values.length < 2) return 0;

  let sum = 0;
  for (const v of values) sum += v;

  const mean = sum / values.length;

  let variance = 0;
  for (const v of values) {
    const d = v - mean;
    variance += d * d;
  }

  // population std dev is fine for our stability metric
  variance /= values.length;

  return Math.sqrt(variance);
}

export function createRollingWindow(size) {
  const buf = [];
  const max = Math.max(2, size | 0);

  return {
    push(value) {
      if (typeof value !== "number" || Number.isNaN(value)) return;
      buf.push(value);
      if (buf.length > max) buf.shift();
    },
    getValues() {
      return buf;
    },
    reset() {
      buf.length = 0;
    },
    size() {
      return buf.length;
    },
  };
}

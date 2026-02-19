// FILE: src/utils/ema.js
export function createEMA(alpha = 0.35) {
  let v = null;

  return {
    next(x) {
      if (x == null || Number.isNaN(x)) return v;
      v = v == null ? x : alpha * x + (1 - alpha) * v;
      return v;
    },
    reset() {
      v = null;
    },
    value() {
      return v;
    },
  };
}

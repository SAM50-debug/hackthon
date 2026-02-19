// FILE: src/utils/shoulderRepCounter.js

export function createShoulderRepCounter() {
  let phase = "DOWN"; // DOWN or UP
  let reps = 0;

  // Stability counters to reduce jitter
  let upHold = 0;
  let downHold = 0;

  const HOLD_FRAMES = 3;

  // tempo tracking
  let repStartMs = null;
  let lastRepDurationSec = null;

  return {
    update({ bothUp, bothDown }) {
      lastRepDurationSec = null;

      if (bothUp) {
        upHold += 1;
        downHold = 0;
      } else if (bothDown) {
        downHold += 1;
        upHold = 0;
      } else {
        upHold = 0;
        downHold = 0;
      }

      // DOWN -> UP (start of rep)
      if (upHold >= HOLD_FRAMES && phase === "DOWN") {
        phase = "UP";
        repStartMs = Date.now();
      }

      // UP -> DOWN (rep complete)
      if (downHold >= HOLD_FRAMES && phase === "UP") {
        phase = "DOWN";
        reps += 1;

        if (repStartMs != null) {
          lastRepDurationSec = (Date.now() - repStartMs) / 1000;
        }
        repStartMs = null;
      }

      return { reps, phase, lastRepDurationSec };
    },

    reset() {
      phase = "DOWN";
      reps = 0;
      upHold = 0;
      downHold = 0;
      repStartMs = null;
      lastRepDurationSec = null;
      return { reps, phase, lastRepDurationSec };
    },
  };
}

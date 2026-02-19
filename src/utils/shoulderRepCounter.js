export function createShoulderRepCounter() {
  let phase = "DOWN"; // DOWN or UP
  let reps = 0;

  // Stability counters to reduce jitter
  let upHold = 0;
  let downHold = 0;

  const HOLD_FRAMES = 3; // more stable than 2

  return {
    update({ bothUp, bothDown }) {
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

      if (upHold >= HOLD_FRAMES && phase === "DOWN") {
        phase = "UP";
      }

      if (downHold >= HOLD_FRAMES && phase === "UP") {
        phase = "DOWN";
        reps += 1;
      }

      return { reps, phase };
    },

    reset() {
      phase = "DOWN";
      reps = 0;
      upHold = 0;
      downHold = 0;
      return { reps, phase };
    },
  };
}

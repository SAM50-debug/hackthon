export function createRepCounter() {
  let phase = "UP"; // UP or DOWN
  let reps = 0;

  return {
    update(kneeAngle) {
      // Down detected
      if (kneeAngle < 100 && phase === "UP") {
        phase = "DOWN";
      }

      // Up detected after down
      if (kneeAngle > 160 && phase === "DOWN") {
        phase = "UP";
        reps += 1;
      }

      return { reps, phase };
    },

    reset() {
      phase = "UP";
      reps = 0;
      return { reps, phase };
    },
  };
}

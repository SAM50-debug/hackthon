// FILE: src/pages/Coach.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import ExerciseSelector from "../components/ExerciseSelector";
import CameraView from "../components/CameraView";
import PoseOverlay from "../components/PoseOverlay";
import usePose from "../hooks/usePose";

import { calculateAngle } from "../utils/angles";
import { createRepCounter } from "../utils/repCounter";
import { createShoulderRepCounter } from "../utils/shoulderRepCounter";
import { computeSessionScore, getDurationSec } from "../utils/scoring";
import { getPerformanceTier } from "../utils/performance";
import { saveSession } from "../lib/storage/sessionStore";

export default function Coach() {
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);

  // timing (eslint-safe: no Date.now() during render)
  const [startedAt, setStartedAt] = useState(null);
  const [nowMs, setNowMs] = useState(0);

  // set an initial nowMs once after mount (safe)
  useEffect(() => {
    setNowMs(Date.now());
  }, []);

  // tick time ONLY while session is active
  useEffect(() => {
    if (!sessionActive) return;
    const id = setInterval(() => setNowMs(Date.now()), 250);
    return () => clearInterval(id);
  }, [sessionActive]);

  const videoRef = useRef(null);

  const { landmarks } = usePose({
    videoRef,
    enabled: sessionActive && !!selectedExercise,
  });

  // Only show overlay while session is active
  const overlayLandmarks = sessionActive ? landmarks : null;

  // Counters (stable)
  const squatCounter = useMemo(() => createRepCounter(), []);
  const shoulderCounter = useMemo(() => createShoulderRepCounter(), []);

  // Squat state
  const [squat, setSquat] = useState({
    kneeAngle: null,
    reps: 0,
    phase: "UP",
  });

  // Shoulder state
  const [shoulder, setShoulder] = useState({
    reps: 0,
    phase: "DOWN",
    leftUp: false,
    rightUp: false,
    symmetryOk: true,
  });

  // Session metrics
  const [metrics, setMetrics] = useState({
    totalFrames: 0,
    badFrames: 0,
    mistakes: {
      squatTooHigh: 0,
      squatUnstable: 0,
      shoulderAsymmetry: 0,
      shoulderNotHighEnough: 0,
    },
  });

  // ---- Squat Logic ----
  useEffect(() => {
    if (!landmarks) return;
    if (selectedExercise !== "Squat") return;

    const hip = landmarks[23];
    const knee = landmarks[25];
    const ankle = landmarks[27];
    if (!hip || !knee || !ankle) return;

    const angle = calculateAngle(hip, knee, ankle);
    const result = squatCounter.update(angle);

    setSquat({
      kneeAngle: Math.round(angle),
      reps: result.reps,
      phase: result.phase,
    });

    if (!sessionActive) return;

    const tooHigh = angle > 150;
    const unstable = angle > 110 && angle <= 150;

    setMetrics((m) => ({
      ...m,
      totalFrames: m.totalFrames + 1,
      badFrames: m.badFrames + (tooHigh || unstable ? 1 : 0),
      mistakes: {
        ...m.mistakes,
        squatTooHigh: m.mistakes.squatTooHigh + (tooHigh ? 1 : 0),
        squatUnstable: m.mistakes.squatUnstable + (unstable ? 1 : 0),
      },
    }));
  }, [landmarks, selectedExercise, squatCounter, sessionActive]);

  // ---- Shoulder Raise Logic ----
  useEffect(() => {
    if (!landmarks) return;
    if (selectedExercise !== "Shoulder Raise") return;

    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftElbow = landmarks[13];
    const rightElbow = landmarks[14];

    if (!leftShoulder || !rightShoulder || !leftElbow || !rightElbow) return;

    const minVis = 0.6;
    if (
      (leftElbow.visibility ?? 1) < minVis ||
      (rightElbow.visibility ?? 1) < minVis ||
      (leftShoulder.visibility ?? 1) < minVis ||
      (rightShoulder.visibility ?? 1) < minVis
    ) {
      return;
    }

    const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
    const margin = Math.max(0.02, Math.min(0.06, shoulderWidth * 0.15));

    const leftUp = leftElbow.y < leftShoulder.y - margin;
    const rightUp = rightElbow.y < rightShoulder.y - margin;

    const heightDiff = Math.abs(leftElbow.y - rightElbow.y);
    const symmetryOk = heightDiff <= margin * 1.2;

    const bothUp = leftUp && rightUp;
    const bothDown =
      leftElbow.y > leftShoulder.y + margin &&
      rightElbow.y > rightShoulder.y + margin;

    const result = shoulderCounter.update({ bothUp, bothDown });

    setShoulder({
      reps: result.reps,
      phase: result.phase,
      leftUp,
      rightUp,
      symmetryOk,
    });

    if (!sessionActive) return;

    // Only evaluate when actively attempting movement
    const attemptingRaise = leftUp || rightUp || result.phase === "UP";
    if (!attemptingRaise) return;

    const notHighEnough = !bothUp && result.phase === "UP";
    const asymmetry = !symmetryOk && result.phase === "UP";

    setMetrics((m) => ({
      ...m,
      totalFrames: m.totalFrames + 1,
      badFrames: m.badFrames + (asymmetry || notHighEnough ? 1 : 0),
      mistakes: {
        ...m.mistakes,
        shoulderAsymmetry: m.mistakes.shoulderAsymmetry + (asymmetry ? 1 : 0),
        shoulderNotHighEnough:
          m.mistakes.shoulderNotHighEnough + (notHighEnough ? 1 : 0),
      },
    }));
  }, [landmarks, selectedExercise, shoulderCounter, sessionActive]);

  // Reset on exercise change (no Date.now() here; keep it pure + predictable)
  useEffect(() => {
    squatCounter.reset();
    shoulderCounter.reset();

    setSquat({ kneeAngle: null, reps: 0, phase: "UP" });
    setShoulder({
      reps: 0,
      phase: "DOWN",
      leftUp: false,
      rightUp: false,
      symmetryOk: true,
    });

    setSessionActive(false);
    setStartedAt(null);
    setNowMs(0);

    setMetrics({
      totalFrames: 0,
      badFrames: 0,
      mistakes: {
        squatTooHigh: 0,
        squatUnstable: 0,
        shoulderAsymmetry: 0,
        shoulderNotHighEnough: 0,
      },
    });
  }, [selectedExercise, squatCounter, shoulderCounter]);

  // Feedback
  let feedback = "Select an exercise to begin.";

  if (selectedExercise === "Squat") {
    if (squat.kneeAngle === null) feedback = "Stand in camera view.";
    else if (squat.kneeAngle > 150) feedback = "Go lower into the squat.";
    else if (squat.kneeAngle <= 110) feedback = "Good depth ✅ Now push up.";
    else feedback = "Hold steady. Control your movement.";
  }

  if (selectedExercise === "Shoulder Raise") {
    if (!landmarks && sessionActive) feedback = "Stand in camera view.";
    else if (!shoulder.symmetryOk) feedback = "Raise both arms evenly.";
    else if (shoulder.phase === "DOWN") feedback = "Raise arms above shoulders.";
    else feedback = "Great ✅ Now lower arms to complete rep.";
  }

  // live duration + normalized score
  const liveDurationSec =
    sessionActive && startedAt ? getDurationSec(startedAt, nowMs) : 0;

  const score = computeSessionScore({
    badFrames: metrics.badFrames,
    durationSec: liveDurationSec,
  });

  const tierInfo = getPerformanceTier(score);

  function startSession() {
    if (!selectedExercise) return;

    squatCounter.reset();
    shoulderCounter.reset();

    setSquat({ kneeAngle: null, reps: 0, phase: "UP" });
    setShoulder({
      reps: 0,
      phase: "DOWN",
      leftUp: false,
      rightUp: false,
      symmetryOk: true,
    });

    setMetrics({
      totalFrames: 0,
      badFrames: 0,
      mistakes: {
        squatTooHigh: 0,
        squatUnstable: 0,
        shoulderAsymmetry: 0,
        shoulderNotHighEnough: 0,
      },
    });

    const start = Date.now();
    setStartedAt(start);
    setNowMs(start);
    setSessionActive(true);
  }

  function endSession() {
    // freeze-safe guard
    if (!selectedExercise || !startedAt) return;

    const endMs = Date.now();
    const durationSec = getDurationSec(startedAt, endMs);

    const finalScore = computeSessionScore({
      badFrames: metrics.badFrames,
      durationSec,
    });

    const tier = getPerformanceTier(finalScore).label;

    const session = {
      id: crypto.randomUUID(),
      exercise: selectedExercise,
      reps: selectedExercise === "Squat" ? squat.reps : shoulder.reps,
      score: finalScore,
      tier,
      durationSec,
      createdAt: new Date().toISOString(),
      mistakes: metrics.mistakes,
    };

    saveSession(session);
    setSessionActive(false);
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h2 className="text-2xl font-bold text-blue-700 mb-6">
        Coaching Session
      </h2>

      <ExerciseSelector
        selected={selectedExercise}
        onSelect={setSelectedExercise}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Camera</h3>

          <div className="relative w-full max-w-2xl">
            <CameraView
              isActive={sessionActive && !!selectedExercise}
              ref={videoRef}
            />
            <PoseOverlay landmarks={overlayLandmarks} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 text-gray-700">
          <h3 className="font-semibold mb-4">Live Feedback</h3>

          {selectedExercise ? (
            <>
              <p>
                Selected Exercise:{" "}
                <span className="font-semibold">{selectedExercise}</span>
              </p>

              <div className="mt-4 flex gap-3 flex-wrap">
                {!sessionActive ? (
                  <button
                    onClick={startSession}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Start Session
                  </button>
                ) : (
                  <button
                    onClick={endSession}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                  >
                    End & Save
                  </button>
                )}

                <div className="px-4 py-2 rounded-lg border bg-white flex items-center gap-2">
                  <span className="text-gray-500 text-sm">Score</span>
                  <span className="font-bold">{score}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${tierInfo.className}`}
                  >
                    {tierInfo.label}
                  </span>
                </div>

                {sessionActive && (
                  <div className="px-4 py-2 rounded-lg border bg-white">
                    <span className="text-gray-500 text-sm mr-2">Time</span>
                    <span className="font-bold">{liveDurationSec}s</span>
                  </div>
                )}
              </div>

              <div className="mt-4 p-4 rounded-lg bg-gray-50 border">
                <p className="font-semibold text-blue-700">{feedback}</p>
                <p className="mt-2 text-xs text-gray-500">
                  Session status:{" "}
                  <span className="font-semibold">
                    {sessionActive ? "ACTIVE" : "NOT ACTIVE"}
                  </span>
                </p>
              </div>

              {selectedExercise === "Squat" && (
                <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
                  <div className="p-3 bg-white border rounded-lg">
                    <p className="text-gray-500">Knee Angle</p>
                    <p className="text-lg font-bold">
                      {squat.kneeAngle ?? "--"}°
                    </p>
                  </div>
                  <div className="p-3 bg-white border rounded-lg">
                    <p className="text-gray-500">Phase</p>
                    <p className="text-lg font-bold">{squat.phase}</p>
                  </div>
                  <div className="p-3 bg-white border rounded-lg">
                    <p className="text-gray-500">Reps</p>
                    <p className="text-lg font-bold">{squat.reps}</p>
                  </div>
                </div>
              )}

              {selectedExercise === "Shoulder Raise" && (
                <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
                  <div className="p-3 bg-white border rounded-lg">
                    <p className="text-gray-500">Symmetry</p>
                    <p className="text-lg font-bold">
                      {shoulder.symmetryOk ? "OK" : "Fix"}
                    </p>
                  </div>
                  <div className="p-3 bg-white border rounded-lg">
                    <p className="text-gray-500">Phase</p>
                    <p className="text-lg font-bold">{shoulder.phase}</p>
                  </div>
                  <div className="p-3 bg-white border rounded-lg">
                    <p className="text-gray-500">Reps</p>
                    <p className="text-lg font-bold">{shoulder.reps}</p>
                  </div>
                </div>
              )}

              <p className="mt-4 text-xs text-gray-400">
                Landmarks detected:{" "}
                {overlayLandmarks ? overlayLandmarks.length : 0}
              </p>
            </>
          ) : (
            <p>Please select an exercise to begin.</p>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-8 max-w-2xl">
        This tool is for educational purposes only and does not provide medical
        advice.
      </p>
    </div>
  );
}

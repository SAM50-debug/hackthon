import { useEffect, useMemo, useRef, useState } from "react";
import {
  computeRepScore,
  computeFatigueTrend,
  sessionSummaryEngine,
} from "../utils/analytics";
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
import { createEMA } from "../utils/ema";
import { createRollingWindow, computeStdDev } from "../utils/variance";

export default function Coach() {
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);

  // timing (eslint-safe: no Date.now() during render)
  const [startedAt, setStartedAt] = useState(null);
  const [nowMs, setNowMs] = useState(0);

  // app pause (tab hidden)
  const [appPaused, setAppPaused] = useState(false);

  // timeline sampling (for sparkline)
  const timelineRef = useRef([]); // [{t, hd}]
  const lastSampleAtRef = useRef(0);
  const unstableRef = useRef(false);

  // NEW: Analytics Refs (No re-renders)
  const repScoresRef = useRef([]);
  const currentRepRef = useRef({
    peakAsymmetry: 0,
    unstableFrames: 0,
    repFrames: 0,
    startMs: null,
  });

  useEffect(() => {
    const onVis = () => setAppPaused(document.hidden);
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // set initial nowMs once after mount
  useEffect(() => {
    setNowMs(Date.now());
  }, []);

  // tick time ONLY while session active & not paused
  useEffect(() => {
    if (!sessionActive || appPaused) return;
    const id = setInterval(() => setNowMs(Date.now()), 250);
    return () => clearInterval(id);
  }, [sessionActive, appPaused]);

  const videoRef = useRef(null);

  const { landmarks } = usePose({
    videoRef,
    enabled: sessionActive && !appPaused && !!selectedExercise,
  });

  // show overlay only while active + not paused
  const overlayLandmarks = sessionActive && !appPaused ? landmarks : null;

  // counters
  const squatCounter = useMemo(() => createRepCounter(), []);
  const shoulderCounter = useMemo(() => createShoulderRepCounter(), []);

  // EMA filters
  const leftElbowY = useMemo(() => createEMA(0.35), []);
  const rightElbowY = useMemo(() => createEMA(0.35), []);

  // stability window (rolling std dev of elbow heightDiff)
  const shoulderWindow = useMemo(() => createRollingWindow(15), []);

  // calibration state
  const [calibration, setCalibration] = useState({
    active: false,
    ready: false,
    startMs: null,
    samples: [],
    margin: 0.03,
  });

  // squat UI state
  const [squat, setSquat] = useState({
    kneeAngle: null,
    reps: 0,
    phase: "UP",
  });

  // shoulder UI state
  const [shoulder, setShoulder] = useState({
    reps: 0,
    phase: "DOWN",
    leftUp: false,
    rightUp: false,
    symmetryOk: true,
  });

  // metrics
  const [metrics, setMetrics] = useState({
    totalFrames: 0,
    badFrames: 0,
    unstableFrames: 0,
    mistakes: {
      squatTooHigh: 0,
      squatUnstable: 0,
      shoulderAsymmetry: 0,
      shoulderNotHighEnough: 0,
      shoulderTooFast: 0,
      shoulderTooSlow: 0,
      shoulderUnstable: 0,
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

  // ---- Shoulder Raise Logic (EMA + calibration + stability + tempo + timeline) ----
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

    // EMA smooth elbows
    const lY = leftElbowY.next(leftElbow.y);
    const rY = rightElbowY.next(rightElbow.y);
    if (lY == null || rY == null) return;

    // Calibration phase (~2s)
    if (sessionActive && calibration.active && !calibration.ready) {
      const now = Date.now();
      const elapsed = calibration.startMs ? now - calibration.startMs : 0;

      const baseOffset =
        ((lY - leftShoulder.y) + (rY - rightShoulder.y)) / 2;

      if (elapsed < 2000) {
        setCalibration((c) => {
          const nextSamples =
            c.samples.length < 180 ? [...c.samples, baseOffset] : c.samples;
          return { ...c, samples: nextSamples };
        });
        return;
      }

      const samples = calibration.samples;
      const avg =
        samples.reduce((a, b) => a + b, 0) / Math.max(samples.length, 1);

      const dynamicMargin = Math.min(
        0.08,
        Math.max(0.02, Math.abs(avg) * 0.4 + 0.02)
      );

      setCalibration((c) => ({
        ...c,
        active: false,
        ready: true,
        margin: dynamicMargin,
        samples: [],
      }));

      return;
    }

    // fallback margin (if not calibrated yet)
    const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
    const dynamicBase = Math.max(0.02, Math.min(0.06, shoulderWidth * 0.15));
    const margin = calibration.ready ? calibration.margin : dynamicBase;

    const leftUp = lY < leftShoulder.y - margin;
    const rightUp = rY < rightShoulder.y - margin;

    const heightDiff = Math.abs(lY - rY);
    const symmetryOk = heightDiff <= margin * 1.2;

    const bothUp = leftUp && rightUp;
    const bothDown =
      lY > leftShoulder.y + margin && rY > rightShoulder.y + margin;

    const result = shoulderCounter.update({ bothUp, bothDown });

    setShoulder({
      reps: result.reps,
      phase: result.phase,
      leftUp,
      rightUp,
      symmetryOk,
    });

    if (!sessionActive) return;
    if (calibration.active && !calibration.ready) return;

    const attemptingRaise = leftUp || rightUp || result.phase === "UP";

    // 1. UPDATE METRICS FOR CURRENT REP
    if (attemptingRaise) {
      // Capture start of rep if not set
      if (currentRepRef.current.startMs === null) {
        currentRepRef.current.startMs = Date.now();
      }

      currentRepRef.current.repFrames++;

      // Track Peak Asymmetry
      currentRepRef.current.peakAsymmetry = Math.max(
          currentRepRef.current.peakAsymmetry,
          heightDiff
      );
    }

    // Timeline sampling (every ~200ms while active)
    if (attemptingRaise) {
      const now = Date.now();
      const last = lastSampleAtRef.current || 0;
      if (now - last >= 200) {
        lastSampleAtRef.current = now;
        const t = startedAt ? Math.max(0, Math.round((now - startedAt) / 1000)) : 0;

        // store normalized symmetry metric: heightDiff (smaller=better)
        timelineRef.current.push({ t, hd: Number(heightDiff.toFixed(4)) });

        // cap timeline size (keeps localStorage light)
        if (timelineRef.current.length > 400) {
          timelineRef.current.splice(0, timelineRef.current.length - 400);
        }
      }
    }

    // Stability / variance (ONLY while moving; reset when idle)
    if (attemptingRaise) {
      shoulderWindow.push(heightDiff);

      if (shoulderWindow.size() >= 10) {
        const std = computeStdDev(shoulderWindow.getValues());
        const unstable = std > Math.max(0.01, margin * 0.6); // dynamic threshold ✅

        if (unstable) {
          // NEW: Count unstable frames for this rep
          currentRepRef.current.unstableFrames++;
        }

        // Count as an "event" only when it flips stable -> unstable
        if (unstable && !unstableRef.current) {
          unstableRef.current = true;

          setMetrics((m) => ({
            ...m,
            unstableFrames: m.unstableFrames + 1,
            mistakes: {
              ...m.mistakes,
              shoulderUnstable: m.mistakes.shoulderUnstable + 1,
            },
          }));
        }

        // Reset when it becomes stable again
        if (!unstable && unstableRef.current) {
          unstableRef.current = false;
        }
      }
    } else {
      shoulderWindow.reset();
      unstableRef.current = false;
    }


    // Frame-based errors (only while moving)
    if (attemptingRaise) {
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
    }

    // Tempo scoring (only when rep completes)
    if (result.lastRepDurationSec != null) {
      const d = result.lastRepDurationSec;
      const tooFast = d < 0.5;
      const tooSlow = d > 4.0;

      if (tooFast || tooSlow) {
        setMetrics((m) => ({
          ...m,
          mistakes: {
            ...m.mistakes,
            shoulderTooFast: m.mistakes.shoulderTooFast + (tooFast ? 1 : 0),
            shoulderTooSlow: m.mistakes.shoulderTooSlow + (tooSlow ? 1 : 0),
          },
        }));
      }

      // NEW: ANALYTICS - Compute Rep Score
      const repMetrics = {
          peakHeightDiff: currentRepRef.current.peakAsymmetry,
          unstableFrameCount: currentRepRef.current.unstableFrames,
          totalFrames: currentRepRef.current.repFrames,
          durationSec: d,
          margin: calibration.ready ? calibration.margin : 0.05,
      };

      const repAnalysis = computeRepScore(repMetrics);
      // Append extra context for storage/debugging
      repScoresRef.current.push({
        ...repAnalysis,
        durationSec: d,
        repIndex: repScoresRef.current.length + 1
      });

      // Reset for next rep
      currentRepRef.current = {
          peakAsymmetry: 0,
          unstableFrames: 0,
          repFrames: 0,
          startMs: null,
      };
    }
  }, [
    landmarks,
    selectedExercise,
    shoulderCounter,
    sessionActive,
    leftElbowY,
    rightElbowY,
    shoulderWindow,
    calibration.active,
    calibration.ready,
    calibration.startMs,
    calibration.samples,
    calibration.margin,
    startedAt,
  ]);

  // Reset on exercise change
  useEffect(() => {
    squatCounter.reset();
    shoulderCounter.reset();
    leftElbowY.reset();
    rightElbowY.reset();
    shoulderWindow.reset();

    timelineRef.current = [];
    lastSampleAtRef.current = 0;
    
    // Reset Analytics
    repScoresRef.current = [];
    currentRepRef.current = { peakAsymmetry: 0, unstableFrames: 0, repFrames: 0, startMs: null };

    setSquat({ kneeAngle: null, reps: 0, phase: "UP" });
    setShoulder({
      reps: 0,
      phase: "DOWN",
      leftUp: false,
      rightUp: false,
      symmetryOk: true,
    });

    setCalibration({
      active: false,
      ready: false,
      startMs: null,
      samples: [],
      margin: 0.03,
    });

    setSessionActive(false);
    setStartedAt(null);
    setNowMs(0);

    setMetrics({
      totalFrames: 0,
      badFrames: 0,
      unstableFrames: 0,
      mistakes: {
        squatTooHigh: 0,
        squatUnstable: 0,
        shoulderAsymmetry: 0,
        shoulderNotHighEnough: 0,
        shoulderTooFast: 0,
        shoulderTooSlow: 0,
        shoulderUnstable: 0,
      },
    });
  }, [
    selectedExercise,
    squatCounter,
    shoulderCounter,
    leftElbowY,
    rightElbowY,
    shoulderWindow,
  ]);

  // Feedback
  let feedback = "Select an exercise to begin.";

  if (selectedExercise === "Squat") {
    if (squat.kneeAngle === null) feedback = "Stand in camera view.";
    else if (squat.kneeAngle > 150) feedback = "Go lower into the squat.";
    else if (squat.kneeAngle <= 110) feedback = "Good depth ✅ Now push up.";
    else feedback = "Hold steady. Control your movement.";
  }

  if (selectedExercise === "Shoulder Raise") {
    if (sessionActive && calibration.active && !calibration.ready)
      feedback = "Calibrating… stand straight for 2 seconds.";
    else if (!landmarks && sessionActive) feedback = "Stand in camera view.";
    else if (!shoulder.symmetryOk) feedback = "Raise both arms evenly.";
    else if (shoulder.phase === "DOWN") feedback = "Raise arms above shoulders.";
    else feedback = "Great ✅ Now lower arms to complete rep.";
  }

  const liveDurationSec =
    sessionActive && startedAt ? getDurationSec(startedAt, nowMs) : 0;

  const score = computeSessionScore({
    badFrames: metrics.badFrames,
    unstableFrames: metrics.unstableFrames,
    durationSec: liveDurationSec,
  });

  const tierInfo = getPerformanceTier(score);

  function startSession() {
    if (!selectedExercise) return;

    squatCounter.reset();
    shoulderCounter.reset();
    leftElbowY.reset();
    rightElbowY.reset();
    shoulderWindow.reset();

    timelineRef.current = [];
    lastSampleAtRef.current = 0;
    
    // Reset Analytics
    repScoresRef.current = [];
    currentRepRef.current = { peakAsymmetry: 0, unstableFrames: 0, repFrames: 0, startMs: null };

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
      unstableFrames: 0,
      mistakes: {
        squatTooHigh: 0,
        squatUnstable: 0,
        shoulderAsymmetry: 0,
        shoulderNotHighEnough: 0,
        shoulderTooFast: 0,
        shoulderTooSlow: 0,
        shoulderUnstable: 0,
      },
    });

    const start = Date.now();
    setStartedAt(start);
    setNowMs(start);

    if (selectedExercise === "Shoulder Raise") {
      setCalibration({
        active: true,
        ready: false,
        startMs: start,
        samples: [],
        margin: 0.03,
      });
    } else {
      setCalibration({
        active: false,
        ready: false,
        startMs: null,
        samples: [],
        margin: 0.03,
      });
    }

    setSessionActive(true);
  }

  function endSession() {
    if (!selectedExercise || !startedAt) return;

    const endMs = Date.now();
    const durationSec = getDurationSec(startedAt, endMs);

    const finalScore = computeSessionScore({
      badFrames: metrics.badFrames,
      unstableFrames: metrics.unstableFrames,
      durationSec,
    });

    const tier = getPerformanceTier(finalScore).label;

    // NEW: Analytics Post-Processing
    const repScores = repScoresRef.current;
    const fatigue = computeFatigueTrend(repScores);
    
    // Prepare ephemeral object for summary engine
    const sessionForSummary = {
        fatigue,
        repScores,
        mistakes: metrics.mistakes,
        score: finalScore
    };
    
    const aiSummary = sessionSummaryEngine(sessionForSummary);

    const session = {
      id: crypto.randomUUID(),
      exercise: selectedExercise,
      reps: selectedExercise === "Squat" ? squat.reps : shoulder.reps,
      score: finalScore,
      tier,
      durationSec,
      createdAt: new Date().toISOString(),
      mistakes: metrics.mistakes,
      calibration: calibration.ready ? { margin: calibration.margin } : null,

      // ✅ sparkline data
      timeline: timelineRef.current,
      
      // ✅ Advanced Analytics Fields
      repScores,
      fatigue,
      aiSummary
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

      {sessionActive && appPaused && (
        <div className="mt-4 mb-2 p-3 rounded-lg border bg-yellow-50 text-yellow-800">
          Paused: tab is hidden. Come back to resume.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Camera</h3>

          <div className="relative w-full max-w-2xl">
            <CameraView
              isActive={sessionActive && !!selectedExercise && !appPaused}
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

                {sessionActive &&
                  selectedExercise === "Shoulder Raise" &&
                  calibration.ready && (
                    <div className="px-4 py-2 rounded-lg border bg-white">
                      <span className="text-gray-500 text-sm mr-2">
                        Calibrated margin
                      </span>
                      <span className="font-bold">
                        {calibration.margin.toFixed(3)}
                      </span>
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

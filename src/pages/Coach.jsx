// FILE: src/pages/Coach.jsx
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
import { supabase } from "../lib/supabaseClient";
import { saveSessionCloud } from "../lib/storage/sessionCloudStore";

export default function Coach() {
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);

  const [startedAt, setStartedAt] = useState(null);
  const [nowMs, setNowMs] = useState(0);

  const [appPaused, setAppPaused] = useState(false);

  // timeline sampling (for sparkline)
  const timelineRef = useRef([]); // [{t, hd}]
  const lastSampleAtRef = useRef(0);

  // instability event debounce
  const lastUnstableAtRef = useRef(0);
  const unstableCooldownMs = 500;

  // Analytics refs (no re-renders)
  const repScoresRef = useRef([]);
  const currentRepRef = useRef({
    peakAsymmetry: 0,
    unstableEvents: 0, // ✅ count events, not frames
    repFrames: 0,
    startMs: null,
  });

  useEffect(() => {
    const onVis = () => setAppPaused(document.hidden);
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    setNowMs(Date.now());
  }, []);

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

  const overlayLandmarks = sessionActive && !appPaused ? landmarks : null;

  const squatCounter = useMemo(() => createRepCounter(), []);
  const shoulderCounter = useMemo(() => createShoulderRepCounter(), []);

  const leftElbowY = useMemo(() => createEMA(0.35), []);
  const rightElbowY = useMemo(() => createEMA(0.35), []);

  const shoulderWindow = useMemo(() => createRollingWindow(15), []);

  const [calibration, setCalibration] = useState({
    active: false,
    ready: false,
    startMs: null,
    samples: [],
    margin: 0.03,
  });

  const [squat, setSquat] = useState({
    kneeAngle: null,
    reps: 0,
    phase: "UP",
  });

  const [shoulder, setShoulder] = useState({
    reps: 0,
    phase: "DOWN",
    leftUp: false,
    rightUp: false,
    symmetryOk: true,
  });

  const [metrics, setMetrics] = useState({
    totalFrames: 0,
    badFrames: 0,
    unstableFrames: 0, // (kept for session score)
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

    // ---- Analytics: track rep frames + peak asymmetry ----
    if (attemptingRaise) {
      if (currentRepRef.current.startMs == null) {
        currentRepRef.current.startMs = Date.now();
      }
      currentRepRef.current.repFrames += 1;
      currentRepRef.current.peakAsymmetry = Math.max(
        currentRepRef.current.peakAsymmetry,
        heightDiff
      );
    }

    // Timeline sampling
    if (attemptingRaise) {
      const now = Date.now();
      const last = lastSampleAtRef.current || 0;
      if (now - last >= 200) {
        lastSampleAtRef.current = now;
        const t = startedAt ? Math.max(0, Math.round((now - startedAt) / 1000)) : 0;
        timelineRef.current.push({ t, hd: Number(heightDiff.toFixed(4)) });
        if (timelineRef.current.length > 400) {
          timelineRef.current.splice(0, timelineRef.current.length - 400);
        }
      }
    }

    // Stability / variance -> count instability as events (debounced)
    if (attemptingRaise) {
      shoulderWindow.push(heightDiff);

      if (shoulderWindow.size() >= 10) {
        const std = computeStdDev(shoulderWindow.getValues());
        const unstable = std > Math.max(0.01, margin * 0.6); // ✅ semicolon

        if (unstable) {
          const now = Date.now();
          if (now - (lastUnstableAtRef.current || 0) >= unstableCooldownMs) {
            lastUnstableAtRef.current = now;

            // ✅ increment instability event count for rep scoring
            currentRepRef.current.unstableEvents += 1;

            setMetrics((m) => ({
              ...m,
              unstableFrames: m.unstableFrames + 1,
              mistakes: {
                ...m.mistakes,
                shoulderUnstable: m.mistakes.shoulderUnstable + 1,
              },
            }));
          }
        }
      }
    } else {
      shoulderWindow.reset();
      lastUnstableAtRef.current = 0;
    }

    // Frame-based errors
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

    // Rep complete -> compute rep score
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

      const repMetrics = {
        peakHeightDiff: currentRepRef.current.peakAsymmetry,
        unstableFrameCount: currentRepRef.current.unstableEvents, // ✅ events
        totalFrames: currentRepRef.current.repFrames,
        durationSec: d,
        margin: calibration.ready ? calibration.margin : 0.05,
      };

      const repAnalysis = computeRepScore(repMetrics);

      repScoresRef.current.push({
        ...repAnalysis,
        repIndex: repScoresRef.current.length + 1,
      });

      currentRepRef.current = {
        peakAsymmetry: 0,
        unstableEvents: 0,
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
    lastUnstableAtRef.current = 0;

    repScoresRef.current = [];
    currentRepRef.current = {
      peakAsymmetry: 0,
      unstableEvents: 0,
      repFrames: 0,
      startMs: null,
    };

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

  // Feedback Logic
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
    lastUnstableAtRef.current = 0;

    repScoresRef.current = [];
    currentRepRef.current = {
      peakAsymmetry: 0,
      unstableEvents: 0,
      repFrames: 0,
      startMs: null,
    };

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

  async function endSession() {
  if (!selectedExercise || !startedAt) return;

  const endMs = Date.now();
  const durationSec = getDurationSec(startedAt, endMs);

  const finalScore = computeSessionScore({
    badFrames: metrics.badFrames,
    unstableFrames: metrics.unstableFrames,
    durationSec,
  });

  const tier = getPerformanceTier(finalScore).label;
  const isShoulder = selectedExercise === "Shoulder Raise";

  // ✅ Only run analytics when Shoulder Raise
  const repScores = isShoulder ? repScoresRef.current : null;
  const fatigue = isShoulder ? computeFatigueTrend(repScoresRef.current) : null;

  const aiSummary = isShoulder
    ? sessionSummaryEngine({
        fatigue,
        repScores: repScoresRef.current,
        mistakes: metrics.mistakes,
        score: finalScore,
      })
    : null;

  const session = {
    id: crypto.randomUUID(),
    exercise: selectedExercise,
    reps: selectedExercise === "Squat" ? squat.reps : shoulder.reps,
    score: finalScore,
    tier,
    durationSec,
    createdAt: new Date().toISOString(),
    mistakes: metrics.mistakes,
    calibration: isShoulder && calibration.ready ? { margin: calibration.margin } : null,
    timeline: isShoulder ? timelineRef.current : null,
    repScores,
    fatigue,
    aiSummary,
  };

  // ✅ Save: Supabase if signed in, else localStorage
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;

    if (data?.user) {
      await saveSessionCloud(session);
    } else {
      saveSession(session);
    }
  } catch (e) {
    console.error("Save failed, falling back to local:", e);
    saveSession(session);
  }

  setSessionActive(false);
}

  return (
    <div className="min-h-screen bg-stone-50 p-6 md:p-10 font-sans text-stone-900">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
             <h2 className="text-3xl font-bold text-stone-900 tracking-tight">AI Coach</h2>
             <p className="text-stone-500 mt-1">Real-time pose analysis & feedback</p>
          </div>
          <div className="flex items-center gap-3">
             <div className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide flex items-center gap-2 ${sessionActive ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-600"}`}>
               <div className={`w-2 h-2 rounded-full ${sessionActive ? "bg-emerald-500 animate-pulse" : "bg-stone-400"}`}></div>
               {sessionActive ? "LIVE SESSION" : "IDLE"}
             </div>
          </div>
        </div>

        {/* Setup / Warning */}
        {sessionActive && appPaused && (
           <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 flex items-center gap-2 animate-pulse">
             <span className="font-bold">⚠️ Session Paused:</span> Tab is hidden. Return to resume.
           </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          
          {/* Left Column: Camera (Big) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
             <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden relative group">
                {/* Camera Header - Floating */}
                <div className="absolute top-6 left-6 z-20">
                   <ExerciseSelector selected={selectedExercise} onSelect={setSelectedExercise} />
                </div>

                {/* Status Badge - Floating Right */}
                <div className="absolute top-6 right-6 z-20">
                    <div className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide flex items-center gap-2 backdrop-blur-md shadow-sm border ${
                      sessionActive 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700" 
                        : "bg-white/80 border-stone-200 text-stone-500"
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${sessionActive ? "bg-emerald-500 animate-pulse" : "bg-stone-400"}`}></div>
                      {sessionActive ? "LIVE SESSION" : "IDLE"}
                    </div>
                </div>
                
                {/* Camera Viewport */}
                <div className="relative aspect-[4/3] w-full bg-stone-100 flex items-center justify-center overflow-hidden">
                   <div className="absolute inset-0">
                      <CameraView
                        isActive={sessionActive && !!selectedExercise && !appPaused}
                        ref={videoRef}
                      />
                      <PoseOverlay landmarks={overlayLandmarks} />
                   </div>
                   
                   {!sessionActive && !selectedExercise && (
                      <div className="absolute inset-0 flex items-center justify-center bg-stone-50/50 backdrop-blur-sm z-10">
                          <p className="text-stone-400 font-medium">Select an exercise to begin</p>
                      </div>
                   )}

                   {/* Warning Overlay */}
                   {sessionActive && appPaused && (
                    <div className="absolute inset-0 flex items-center justify-center bg-stone-900/10 backdrop-blur-sm z-30">
                       <div className="px-6 py-3 bg-white/90 rounded-xl shadow-lg border border-amber-200 text-amber-600 font-semibold animate-in fade-in zoom-in duration-200">
                          Session Paused (Tab Hidden)
                       </div>
                    </div>
                   )}
                </div>

                {/* Footer Info */}
                <div className="px-6 py-3 bg-white border-t border-stone-100 flex justify-between items-center text-[10px] uppercase tracking-wider text-stone-400 font-medium">
                   <span>AI Pose Analysis</span>
                   <span>{overlayLandmarks ? "Subject Detected" : "Waiting for Subject"}</span>
                </div>
             </div>
          </div>

          {/* Right Column: Controls & Analytics */}
          <div className="space-y-6 lg:sticky lg:top-8">
             
             {/* Score Card */}
             <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 text-center relative overflow-hidden">
                 <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-stone-200 via-stone-300 to-stone-200 opacity-50"></div>
                 <span className="text-xs text-stone-400 uppercase tracking-widest font-semibold block mb-3">Performance Score</span>
                 <div className="flex items-baseline justify-center gap-1 mb-2">
                    <span className="text-6xl font-bold text-slate-800 tracking-tighter">
                       {score}
                    </span>
                    <span className="text-lg text-stone-300 font-light">/100</span>
                 </div>
                 <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${tierInfo.class ? `bg-opacity-10 border-opacity-20 translate-y-0` : "bg-stone-100 text-stone-500 border-stone-200"}`}>
                   {tierInfo.label}
                 </span>
             </div>

             {/* Live Stats Grid */}
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-white px-5 py-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-center">
                   <p className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold mb-1">Duration</p>
                   <p className="text-xl font-bold text-stone-700 tabular-nums">{liveDurationSec}s</p>
                </div>
                
                {selectedExercise === "Shoulder Raise" && calibration.ready ? (
                  <div className="bg-white px-5 py-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-center">
                     <p className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold mb-1">Calibration</p>
                     <p className="text-xl font-bold text-stone-700 tabular-nums">{calibration.margin.toFixed(2)}</p>
                  </div>
                ) : (
                  <div className="bg-white px-5 py-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-center">
                     <p className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold mb-1">Reps</p>
                     <p className="text-xl font-bold text-stone-700 tabular-nums">
                        {selectedExercise === "Squat" ? squat.reps : shoulder.reps}
                     </p>
                  </div>
                )}
             </div>

             {/* Feedback Board */}
             <div className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-2xl min-h-[120px] flex flex-col justify-center relative backdrop-blur-sm">
                <div className="absolute top-4 left-4 text-indigo-200">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>
                </div>
                <p className="text-center text-indigo-900 font-medium leading-relaxed pl-4">
                  {feedback}
                </p>
             </div>

             {/* Contextual Metrics */}
             {selectedExercise === "Squat" && (
               <div className="bg-white px-5 py-4 rounded-2xl border border-stone-200 shadow-sm">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-stone-500 font-medium">Knee Angle</span>
                    <span className="font-mono font-bold text-stone-700">{squat.kneeAngle ?? "--"}°</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                         className="h-full bg-slate-800 transition-all duration-300" 
                         style={{ width: `${Math.min(100, (squat.kneeAngle || 0) / 1.8)}%` }} 
                      />
                  </div>
               </div>
             )}

             {selectedExercise === "Shoulder Raise" && (
               <div className="bg-white px-5 py-4 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
                  <span className="text-stone-500 font-medium text-sm">Symmetry</span>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${shoulder.symmetryOk ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"}`}>
                      {shoulder.symmetryOk ? (
                          <><span>Excellent</span> <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg></>
                      ) : (
                          <><span>Adjust</span> <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></>
                      )}
                  </div>
               </div>
             )}

             {/* Main Actions */}
             <div className="pt-2">
                {!sessionActive ? (
                  <button
                    disabled={!selectedExercise}
                    onClick={startSession}
                    className="w-full py-4 rounded-xl bg-slate-800 text-white font-bold text-lg shadow-lg hover:bg-slate-700 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2 flex items-center justify-center gap-2"
                  >
                    <span>Start Session</span>
                    <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </button>
                ) : (
                   <button
                    onClick={endSession}
                    className="w-full py-4 rounded-xl bg-white border-2 border-rose-100 text-rose-600 font-bold text-lg shadow-sm hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 transition-all focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 flex items-center justify-center gap-2"
                  >
                     <div className="w-3 h-3 rounded bg-rose-500"></div>
                     <span>End & Save</span>
                  </button>
                )}
             </div>

          </div>
        </div>
        
        <div className="mt-12 text-center text-[10px] text-stone-300 max-w-lg mx-auto leading-relaxed uppercase tracking-wider">
           Not a medical device • Educational use only
        </div>
      </div>
    </div>
  );
}
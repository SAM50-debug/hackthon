import { useEffect, useMemo, useRef, useState } from "react";
import { createPoseEngine } from "../lib/pose/poseEngine";

export default function usePose({ videoRef, enabled }) {
  const [landmarks, setLandmarks] = useState(null);

  const pausedRef = useRef(false);
  const runningRef = useRef(false);
  const rafRef = useRef(null);
  const inFlightRef = useRef(false);

  // Auto-pause when tab hidden; resume when visible
  useEffect(() => {
    const onVis = () => {
      pausedRef.current = document.hidden;
    };
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const pose = useMemo(() => {
    return createPoseEngine({
      onResults: (results) => {
        setLandmarks(results.poseLandmarks || null);
      },
    });
  }, []);

  useEffect(() => {
    const shouldRun = enabled && !pausedRef.current;

    const stop = () => {
      runningRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      inFlightRef.current = false;
      // NOTE: don’t nuke landmarks here — looks like “stuck”.
      // If you want overlay hidden, do it in Coach via overlayLandmarks.
    };

    // If not allowed to run, stop.
    if (!shouldRun) {
      stop();
      return;
    }

    // If already running, do nothing.
    if (runningRef.current) return;

    runningRef.current = true;

    const loop = async () => {
      // Hard stop gate (also stops after tab hidden)
      if (!runningRef.current || pausedRef.current || !enabled) {
        stop();
        return;
      }

      const video = videoRef?.current;
      if (!video) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      if (video.readyState < 2) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // Prevent overlapping sends
      if (inFlightRef.current) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      inFlightRef.current = true;
      try {
        await pose.send({ image: video });
      } catch {
        // ignore transient errors
      } finally {
        inFlightRef.current = false;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => stop();
  }, [enabled, pose, videoRef]);

  return { landmarks };
}

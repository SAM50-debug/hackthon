// FILE: src/hooks/usePose.js
import { useEffect, useMemo, useRef, useState } from "react";
import { createPoseEngine } from "../lib/pose/poseEngine";

export default function usePose({ videoRef, enabled }) {
  const [landmarks, setLandmarks] = useState(null);
  const [paused, setPaused] = useState(false);

  const runningRef = useRef(false);
  const rafRef = useRef(null);

  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
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
    const shouldRun = enabled && !paused;

    const stop = () => {
      runningRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };

    if (!shouldRun) {
      stop();
      // optional: keep last landmarks, or clear if you prefer
      // setLandmarks(null);
      return;
    }

    // IMPORTANT: allow restarting cleanly
    stop();
    runningRef.current = true;

    const loop = async () => {
      if (!runningRef.current) return;

      const video = videoRef?.current;
      if (!video || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      try {
        await pose.send({ image: video });
      } catch {
        // ignore transient errors
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return stop;
  }, [enabled, paused, pose, videoRef]);

  return { landmarks };
}

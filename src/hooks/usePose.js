import { useEffect, useMemo, useState } from "react";
import { createPoseEngine } from "../lib/pose/poseEngine";

export default function usePose({ videoRef, enabled }) {
  const [landmarks, setLandmarks] = useState(null);

  const pose = useMemo(() => {
    return createPoseEngine({
      onResults: (results) => {
        setLandmarks(results.poseLandmarks || null);
      },
    });
  }, []);

  useEffect(() => {
    let rafId = null;

    async function loop() {
      if (!enabled) return;
      if (!videoRef?.current) return;

      // Wait until the video has enough data
      const video = videoRef.current;
      if (video.readyState < 2) {
        rafId = requestAnimationFrame(loop);
        return;
      }

      await pose.send({ image: video });
      rafId = requestAnimationFrame(loop);
    }

    if (enabled) {
      rafId = requestAnimationFrame(loop);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [enabled, pose, videoRef]);

  return { landmarks };
}

import { useEffect, useRef } from "react";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { POSE_CONNECTIONS } from "@mediapipe/pose";

export default function PoseOverlay({ landmarks, width = 640, height = 480 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!landmarks) return;

    // Draw pose skeleton
    drawConnectors(ctx, landmarks, POSE_CONNECTIONS, {
      color: "#1D4ED8",
      lineWidth: 3,
    });

    // Draw landmarks
    drawLandmarks(ctx, landmarks, {
      color: "#10B981",
      lineWidth: 2,
      radius: 3,
    });
  }, [landmarks]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute top-0 left-0 w-full h-full"
    />
  );
}

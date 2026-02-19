import { useEffect, useRef, useState, forwardRef } from "react";

const CameraView = forwardRef(function CameraView({ isActive }, videoRef) {
  const internalRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);

  // Pick a stable ref object once
  const activeRef = videoRef ?? internalRef;

  async function startCamera() {
    setError(null);

    try {
      // Stop any existing stream first (important for resume)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      streamRef.current = stream;

      if (activeRef.current) {
        activeRef.current.srcObject = stream;

        // Some browsers need an explicit play() after tab resume
        const p = activeRef.current.play?.();
        if (p && typeof p.catch === "function") p.catch(() => { });
      }
    } catch (err) {
      setError("Camera access denied or not available.");
      console.error(err);
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (activeRef.current) {
      activeRef.current.srcObject = null;
    }
  }

  // Start/stop based on isActive
  useEffect(() => {
    if (isActive) startCamera();
    else stopCamera();

    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  // ✅ Resume camera when returning to tab
  useEffect(() => {
    if (!isActive) return;

    const onVis = () => {
      if (!document.hidden) {
        // when tab becomes visible again, restart camera stream
        startCamera();
      }
    };

    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  return (
    <div className="w-full">
      {error ? (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      ) : (
        <video
          ref={activeRef}
          autoPlay
          playsInline
          muted
          className="w-full max-w-2xl rounded-lg border border-gray-200 bg-black"
        />
      )}
    </div>
  );
});

export default CameraView;

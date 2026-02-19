// FILE: src/components/CameraView.jsx
import { useEffect, useRef, useState, forwardRef } from "react";

const CameraView = forwardRef(function CameraView({ isActive }, videoRef) {
  const internalRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);

  const activeRef = videoRef ?? internalRef;

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      setError(null);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });

        // If we became inactive while awaiting getUserMedia, immediately stop.
        if (cancelled || !isActive) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (activeRef.current) {
          activeRef.current.srcObject = stream;
          // helps some browsers
          activeRef.current.play?.().catch(() => {});
        }
      } catch (err) {
        if (!cancelled) {
          setError("Camera access denied or not available.");
          console.error(err);
        }
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

    if (isActive) startCamera();
    else stopCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
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

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
    <div className="w-full h-full relative overflow-hidden rounded-2xl bg-sv-elev">
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg max-w-sm">
                {error}
            </div>
        </div>
      ) : (
        <video
          ref={activeRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
});

export default CameraView;

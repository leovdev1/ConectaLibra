import { useCallback, useState, useEffect, useRef } from "react";
import CameraStatusOverlay from "@/components/CameraStatusOverlay";
import { useCameraStream } from "@/hooks/use-camera-stream";

interface VideoCaptureProps {
  isActive: boolean;
}

const VideoCapture = ({ isActive }: VideoCaptureProps) => {
  const { cameraError, cameraReady, hasMediaSupport, requestCamera, setVideoElement } = useCameraStream();
  const [retryCount, setRetryCount] = useState(0);

  const handleActivateClick = useCallback(async () => {
    setRetryCount((c) => c + 1);
    try {
      await requestCamera();
    } catch (err) {
      console.error("Erro ao ativar câmera:", err);
    }
  }, [requestCamera]);

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-slate-950 shadow-xl border-2 border-slate-800">
      <video
        ref={setVideoElement}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover"
        style={{ transform: "scaleX(-1)" }}
      />

      {/* Camada de interface sobre o vídeo */}
      <CameraStatusOverlay
        cameraError={cameraError}
        cameraReady={cameraReady}
        hasMediaSupport={hasMediaSupport}
        retryCount={retryCount}
        onActivate={handleActivateClick}
      />
      
      {isActive && cameraReady && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/50 p-2 rounded-full">
          <span className="h-3 w-3 animate-pulse rounded-full bg-red-600" />
          <span className="text-[10px] font-bold text-white uppercase tracking-widest">Traduzindo em tempo real</span>
        </div>
      )}
    </div>
  );
};

export default VideoCapture;
import { useCallback, useState } from "react";
import CameraStatusOverlay from "@/components/CameraStatusOverlay";
import { useCameraStream } from "@/hooks/use-camera-stream";

interface VideoCaptureProps {
  isActive: boolean;
}

const VideoCapture = ({ isActive }: VideoCaptureProps) => {
  const { cameraError, cameraReady, hasMediaSupport, requestCamera, setVideoElement } = useCameraStream();
  const [retryCount, setRetryCount] = useState(0);

  const handleActivateClick = useCallback(() => {
    setRetryCount((c) => c + 1);
    void requestCamera();
  }, [requestCamera]);

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-video-bg shadow-lg">
      <video
        ref={setVideoElement}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover pointer-events-none"
        style={{ transform: "scaleX(-1)" }}
      />

      <CameraStatusOverlay
        cameraError={cameraError}
        cameraReady={cameraReady}
        hasMediaSupport={hasMediaSupport}
        retryCount={retryCount}
        onActivate={handleActivateClick}
      />

      {isActive && cameraReady && (
        <div className="pointer-events-none">
          <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
            <span className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
            <span className="text-primary-foreground text-sm font-medium tracking-wide drop-shadow">REC</span>
          </div>
          <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-primary/70 rounded-tl z-10" />
          <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-primary/70 rounded-tr z-10" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-primary/70 rounded-bl z-10" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-primary/70 rounded-br z-10" />
        </div>
      )}
    </div>
  );
};

export default VideoCapture;

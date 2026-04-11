import { useEffect, useRef, useState } from "react";
import { Video, VideoOff } from "lucide-react";

interface VideoCaptureProps {
  isActive: boolean;
}

const VideoCapture = ({ isActive }: VideoCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (isActive) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "user" }, audio: false })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setCameraError(null);
        })
        .catch((err) => {
          console.error("Erro ao acessar câmera:", err);
          setCameraError("Não foi possível acessar a câmera.");
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setCameraError(null);
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [isActive]);

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-video-bg shadow-lg">
      {isActive ? (
        <>
          {cameraError ? (
            <div className="absolute inset-0 flex items-center justify-center text-destructive">
              <p className="text-sm font-medium">{cameraError}</p>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover mirror"
              style={{ transform: "scaleX(-1)" }}
            />
          )}
          {/* Recording indicator */}
          <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
            <span className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
            <span className="text-primary-foreground text-sm font-medium tracking-wide drop-shadow">REC</span>
          </div>
          {/* Camera overlay corners */}
          <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-primary/70 rounded-tl z-10" />
          <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-primary/70 rounded-tr z-10" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-primary/70 rounded-bl z-10" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-primary/70 rounded-br z-10" />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <VideoOff className="w-12 h-12" />
            <p className="text-sm font-medium">Câmera desativada</p>
            <p className="text-xs">Clique em "Iniciar Tradução" para começar</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCapture;

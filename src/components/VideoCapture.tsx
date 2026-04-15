import { useEffect, useRef, useState, useCallback } from "react";
import { VideoOff, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoCaptureProps {
  isActive: boolean;
}

const VideoCapture = ({ isActive }: VideoCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef(false);
  const isStartingRef = useRef(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const attachStreamToVideo = useCallback(async (stream: MediaStream) => {
    const video = videoRef.current;

    if (!video) return;

    video.srcObject = stream;

    const playVideo = async () => {
      try {
        await video.play();
      } catch (error) {
        console.warn("Auto-play bloqueado, aguardando interação do usuário:", error);
      }
    };

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      await playVideo();
      return;
    }

    video.onloadedmetadata = () => {
      void playVideo();
    };
  }, []);

  const setVideoElement = useCallback(
    (node: HTMLVideoElement | null) => {
      videoRef.current = node;

      if (node && streamRef.current) {
        void attachStreamToVideo(streamRef.current);
      }
    },
    [attachStreamToVideo],
  );

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.onloadedmetadata = null;
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
    setCameraError(null);
  }, []);

  const startCamera = useCallback(async () => {
    if (isStartingRef.current) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Seu navegador não suporta acesso à câmera.");
      setCameraReady(false);
      return;
    }

    isStartingRef.current = true;
    setCameraError(null);
    setCameraReady(false);

    try {
      console.log("📷 Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      if (!isMountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      console.log("✅ Camera stream obtained:", stream.getVideoTracks()[0]?.label);

      streamRef.current = stream;

      await attachStreamToVideo(stream);

      setCameraError(null);
      setCameraReady(true);
    } catch (err: any) {
      console.error("❌ Falha ao iniciar a câmera via getUserMedia:", err);

      if (!isMountedRef.current) return;

      if (err.name === "NotAllowedError") {
        setCameraError("Permissão negada. Habilite a câmera nas configurações do navegador.");
      } else if (err.name === "NotFoundError") {
        setCameraError("Câmera não encontrada.");
      } else {
        setCameraError(`Não foi possível acessar a câmera: ${err.message}`);
      }
      setCameraReady(false);
    } finally {
      isStartingRef.current = false;
    }
  }, [attachStreamToVideo]);

  useEffect(() => {
    isMountedRef.current = true;

    void startCamera();

    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-video-bg shadow-lg">
      <video
        ref={setVideoElement}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover ${cameraError ? "hidden" : ""}`}
        style={{ transform: "scaleX(-1)" }}
      />

      {!cameraReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-video-bg/80 px-4">
          <div className="flex flex-col items-center gap-3 text-center">
            {cameraError ? (
              <p className="text-sm font-medium text-destructive">{cameraError}</p>
            ) : (
              <>
                <VideoOff className="w-12 h-12 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Solicitando acesso à câmera...</p>
                <p className="text-xs text-muted-foreground">Se o vídeo não iniciar sozinho, ative manualmente.</p>
              </>
            )}

            <Button size="sm" variant="outline" onClick={() => void startCamera()} className="gap-2">
              <Camera className="w-4 h-4" />
              Ativar Câmera
            </Button>
          </div>
        </div>
      )}

      {isActive && cameraReady && (
        <>
          <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
            <span className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
            <span className="text-primary-foreground text-sm font-medium tracking-wide drop-shadow">REC</span>
          </div>
          <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-primary/70 rounded-tl z-10" />
          <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-primary/70 rounded-tr z-10" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-primary/70 rounded-bl z-10" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-primary/70 rounded-br z-10" />
        </>
      )}
    </div>
  );
};

export default VideoCapture;

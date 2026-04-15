import { useEffect, useRef, useState, useCallback, type RefCallback } from "react";
import { VideoOff, Camera, RefreshCw } from "lucide-react";
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
  const [hasMediaSupport, setHasMediaSupport] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // Check browser support on mount
  useEffect(() => {
    const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    setHasMediaSupport(supported);
    console.log(`🔍 navigator.mediaDevices.getUserMedia supported: ${supported}`);
    if (!supported) {
      setCameraError("Seu navegador não suporta acesso à câmera (getUserMedia indisponível).");
    }
  }, []);

  const stopCamera = useCallback(() => {
    console.log("🛑 Stopping camera...");
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
  }, []);

  const startCamera = useCallback(async () => {
    if (isStartingRef.current) {
      console.log("⏳ startCamera já em execução, ignorando chamada duplicada.");
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("❌ navigator.mediaDevices.getUserMedia não disponível neste navegador.");
      setCameraError("Seu navegador não suporta acesso à câmera. Tente Chrome, Firefox ou Safari.");
      setCameraReady(false);
      return;
    }

    isStartingRef.current = true;
    setCameraError(null);
    setCameraReady(false);

    try {
      console.log("📷 [startCamera] Solicitando acesso à câmera via getUserMedia...");

      // Stop any previous stream before requesting a new one
      if (streamRef.current) {
        console.log("🔄 Liberando stream anterior...");
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      const videoTrack = stream.getVideoTracks()[0];
      console.log("✅ [startCamera] Stream obtido com sucesso!");
      console.log("   Track label:", videoTrack?.label);
      console.log("   Track readyState:", videoTrack?.readyState);
      console.log("   Track enabled:", videoTrack?.enabled);
      console.log("   Track settings:", JSON.stringify(videoTrack?.getSettings()));

      if (!isMountedRef.current) {
        console.warn("⚠️ Componente desmontado durante getUserMedia, liberando stream.");
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;

      // Attach stream to video element
      const video = videoRef.current;
      if (video) {
        console.log("🎥 [startCamera] Vinculando stream ao elemento <video>...");
        video.srcObject = stream;

        // Wait for metadata then play
        const playVideo = () => {
          video.play()
            .then(() => {
              console.log("▶️ [startCamera] video.play() bem-sucedido!");
              setCameraReady(true);
              setCameraError(null);
            })
            .catch((playErr) => {
              console.warn("⚠️ [startCamera] video.play() falhou (autoplay?):", playErr);
              // Still mark as ready — video may play on user interaction
              setCameraReady(true);
              setCameraError(null);
            });
        };

        if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
          console.log("📋 Video já possui metadata, executando play()...");
          playVideo();
        } else {
          console.log("⏳ Aguardando onloadedmetadata...");
          video.onloadedmetadata = () => {
            console.log("📋 onloadedmetadata disparado!");
            playVideo();
          };
        }
      } else {
        console.error("❌ [startCamera] videoRef.current é null! O elemento <video> não está no DOM.");
        setCameraError("Erro interno: elemento de vídeo não encontrado.");
      }

    } catch (err: any) {
      console.error("❌ [startCamera] getUserMedia falhou!");
      console.error("   err.name:", err.name);
      console.error("   err.message:", err.message);
      console.error("   err completo:", err);

      if (!isMountedRef.current) return;

      if (err.name === "NotAllowedError") {
        setCameraError("Permissão negada. Clique no ícone de câmera na barra de endereço do navegador para permitir.");
      } else if (err.name === "NotFoundError") {
        setCameraError("Nenhuma câmera detectada no dispositivo.");
      } else if (err.name === "NotReadableError") {
        setCameraError("A câmera está sendo usada por outro aplicativo.");
      } else if (err.name === "OverconstrainedError") {
        setCameraError("Configuração de câmera não suportada. Tentando configuração básica...");
        // Retry with minimal constraints
        isStartingRef.current = false;
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          if (isMountedRef.current && videoRef.current) {
            streamRef.current = fallbackStream;
            videoRef.current.srcObject = fallbackStream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().catch(() => {});
            };
            setCameraReady(true);
            setCameraError(null);
          }
          return;
        } catch {
          setCameraError("Não foi possível acessar a câmera.");
        }
      } else {
        setCameraError(`Não foi possível acessar a câmera: ${err.message}`);
      }
      setCameraReady(false);
    } finally {
      isStartingRef.current = false;
    }
  }, []);

  // Callback ref — ensures video element is available and binds stream if already acquired
  const setVideoElement: RefCallback<HTMLVideoElement> = useCallback(
    (node: HTMLVideoElement | null) => {
      videoRef.current = node;
      if (node && streamRef.current && !node.srcObject) {
        console.log("🔗 [ref callback] Vinculando stream existente ao novo elemento <video>.");
        node.srcObject = streamRef.current;
        node.onloadedmetadata = () => {
          node.play().catch(() => {});
        };
      }
    },
    [],
  );

  // Auto-start camera on mount
  useEffect(() => {
    isMountedRef.current = true;
    console.log("🚀 [useEffect mount] Componente montado, iniciando câmera automaticamente...");
    startCamera();
    return () => {
      console.log("🧹 [useEffect cleanup] Componente desmontando, parando câmera...");
      isMountedRef.current = false;
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const handleActivateClick = useCallback(() => {
    console.log("👆 [Ativar Câmera] Botão clicado pelo usuário.");
    setRetryCount((c) => c + 1);
    isStartingRef.current = false; // Force reset
    startCamera();
  }, [startCamera]);

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
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-video-bg px-4">
          <div className="relative z-30 flex flex-col items-center gap-3 text-center">
            {cameraError ? (
              <>
                <VideoOff className="w-10 h-10 text-destructive" />
                <p className="text-sm font-medium text-destructive max-w-xs">{cameraError}</p>
              </>
            ) : (
              <>
                <VideoOff className="w-12 h-12 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Solicitando acesso à câmera...</p>
                <p className="text-xs text-muted-foreground">Se o vídeo não iniciar sozinho, ative manualmente.</p>
              </>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={handleActivateClick}
              className="relative z-40 gap-2 mt-2 pointer-events-auto"
            >
              {retryCount > 0 ? <RefreshCw className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
              Ativar Câmera
            </Button>

            {!hasMediaSupport && (
              <p className="text-xs text-muted-foreground mt-2">
                Dica: Use Google Chrome ou Safari para melhor compatibilidade.
              </p>
            )}
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

import { useCallback, useState, useRef, forwardRef, useImperativeHandle } from "react";
import CameraStatusOverlay from "@/components/CameraStatusOverlay";
import { useCameraStream } from "@/hooks/use-camera-stream";

interface VideoCaptureProps {
  isActive: boolean;
}

// Usamos forwardRef para que o Index.tsx consiga chamar a função getFrame()
const VideoCapture = forwardRef(({ isActive }: VideoCaptureProps, ref) => {
  const { cameraError, cameraReady, hasMediaSupport, requestCamera, setVideoElement } = useCameraStream();
  const [retryCount, setRetryCount] = useState(0);
  
  // Criamos uma referência local para o elemento de vídeo para o canvas conseguir ler os pixels
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Expõe a função getFrame para o componente pai
  useImperativeHandle(ref, () => ({
    getFrame: () => {
      if (!videoRef.current || !cameraReady) return null;
      
      try {
        const canvas = document.createElement("canvas");
        // Captura a resolução real do vídeo
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        // Desenha o frame atual do vídeo no canvas
        ctx.drawImage(videoRef.current, 0, 0);
        
        // Converte para base64 e remove o prefixo "data:image/jpeg;base64,"
        // O Gemini espera apenas a string codificada
        return canvas.toDataURL("image/jpeg", 0.7).split(",")[1];
      } catch (err) {
        console.error("Erro ao capturar frame:", err);
        return null;
      }
    }
  }));

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
        ref={(node) => {
          setVideoElement(node); // Conecta ao hook de stream
          videoRef.current = node; // Conecta à nossa ref local para o canvas
        }}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover"
        style={{ transform: "scaleX(-1)" }} // Mantém o efeito de espelho
      />

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
});

// Importante: definir um nome de exibição para depuração no React DevTools
VideoCapture.displayName = "VideoCapture";

export default VideoCapture;
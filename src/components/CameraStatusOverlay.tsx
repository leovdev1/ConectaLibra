import { VideoOff, Camera, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CameraStatusOverlayProps {
  cameraError: string | null;
  cameraReady: boolean;
  hasMediaSupport: boolean;
  retryCount: number;
  onActivate: () => void;
}

const CameraStatusOverlay = ({
  cameraError,
  cameraReady,
  hasMediaSupport,
  retryCount,
  onActivate,
}: CameraStatusOverlayProps) => {
  if (cameraReady) return null;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-video-bg px-4">
      <div className="relative z-30 flex flex-col items-center gap-3 text-center">
        {cameraError ? (
          <>
            <VideoOff className="h-10 w-10 text-destructive" />
            <p className="max-w-xs text-sm font-medium text-destructive">{cameraError}</p>
          </>
        ) : (
          <>
            <VideoOff className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Solicitando acesso à câmera...</p>
            <p className="text-xs text-muted-foreground">Se o vídeo não iniciar sozinho, ative manualmente.</p>
          </>
        )}

        <Button size="sm" variant="outline" onClick={onActivate} className="mt-2 gap-2">
          {retryCount > 0 ? <RefreshCw className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
          Ativar Câmera
        </Button>

        {!hasMediaSupport && (
          <p className="mt-2 text-xs text-muted-foreground">Dica: Use Google Chrome ou Safari para melhor compatibilidade.</p>
        )}
      </div>
    </div>
  );
};

export default CameraStatusOverlay;
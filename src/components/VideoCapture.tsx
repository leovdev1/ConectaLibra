import { Video, VideoOff } from "lucide-react";

interface VideoCaptureProps {
  isActive: boolean;
}

const VideoCapture = ({ isActive }: VideoCaptureProps) => {
  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-video-bg shadow-lg">
      {/* Simulated camera view */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isActive ? (
          <>
            {/* Simulated video feed pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-video-bg to-foreground/80 opacity-90" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Hand silhouette placeholder */}
                <div className="w-32 h-32 rounded-full border-4 border-primary/60 flex items-center justify-center animate-pulse">
                  <span className="text-5xl">🤟</span>
                </div>
                {/* Scanning ring */}
                <div className="absolute inset-0 rounded-full border-2 border-primary animate-pulse-ring" />
              </div>
            </div>
            {/* Recording indicator */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
              <span className="text-primary-foreground text-sm font-medium tracking-wide">REC</span>
            </div>
            {/* Camera overlay corners */}
            <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-primary/70 rounded-tl" />
            <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-primary/70 rounded-tr" />
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-primary/70 rounded-bl" />
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-primary/70 rounded-br" />
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <VideoOff className="w-12 h-12" />
            <p className="text-sm font-medium">Câmera desativada</p>
            <p className="text-xs">Clique em "Iniciar Tradução" para começar</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCapture;

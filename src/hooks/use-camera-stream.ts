import { useCallback, useEffect, useRef, useState, type RefCallback } from "react";

// Usamos uma configuração mais flexível para evitar que o Windows bloqueie por causa de resolução
const preferredCameraConstraints: MediaStreamConstraints = {
  video: true, 
  audio: false,
};

const stopTracks = (stream: MediaStream | null) => {
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
};

interface UseCameraStreamResult {
  cameraError: string | null;
  cameraReady: boolean;
  hasMediaSupport: boolean;
  requestCamera: () => Promise<void>;
  setVideoElement: RefCallback<HTMLVideoElement>;
}

export const useCameraStream = (): UseCameraStreamResult => {
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef(false);
  const isStartingRef = useRef(false);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [hasMediaSupport, setHasMediaSupport] = useState(true);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      stopTracks(streamRef.current);
      streamRef.current = null;
    }
    if (videoElementRef.current) {
      videoElementRef.current.srcObject = null;
    }
    setCameraReady(false);
  }, []);

  const requestCamera = useCallback(async () => {
    // Verifica suporte básico
    if (!navigator.mediaDevices?.getUserMedia) {
      setHasMediaSupport(false);
      setCameraError("Navegador incompatível.");
      return;
    }

    if (isStartingRef.current) return;

    isStartingRef.current = true;
    setCameraError(null);
    setCameraReady(false);

    try {
      // Interrompe qualquer stream anterior antes de tentar um novo
      if (streamRef.current) {
        stopTracks(streamRef.current);
      }

      const stream = await navigator.mediaDevices.getUserMedia(preferredCameraConstraints);
      
      if (!isMountedRef.current) {
        stopTracks(stream);
        return;
      }

      streamRef.current = stream;
      
      if (videoElementRef.current) {
        videoElementRef.current.srcObject = stream;
        // Força o play e garante que o estado mude APÓS o vídeo começar
        await videoElementRef.current.play();
        
        // Pequeno delay para garantir que o hardware estabilizou
        setTimeout(() => {
          if (isMountedRef.current) setCameraReady(true);
        }, 100);
      }
    } catch (error: any) {
      console.error("Erro detalhado na câmera:", error);
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setCameraError("Acesso negado. Libere no cadeado do navegador e dê F5.");
      } else {
        setCameraError("Câmera ocupada ou não detectada. Feche outros apps.");
      }
    } finally {
      isStartingRef.current = false;
    }
  }, []);

  const setVideoElement: RefCallback<HTMLVideoElement> = useCallback((node) => {
    videoElementRef.current = node;
    if (node && streamRef.current) {
      node.srcObject = streamRef.current;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Tenta iniciar
    requestCamera();

    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, [requestCamera, stopCamera]);

  return {
    cameraError,
    cameraReady,
    hasMediaSupport,
    requestCamera,
    setVideoElement,
  };
};
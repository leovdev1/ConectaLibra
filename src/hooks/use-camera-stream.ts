import { useCallback, useEffect, useRef, useState, type RefCallback } from "react";

const preferredCameraConstraints: MediaStreamConstraints = {
  video: {
    facingMode: "user",
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
  audio: false,
};

const stopTracks = (stream: MediaStream | null) => {
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
};

const waitForVideoMetadata = (videoElement: HTMLVideoElement) =>
  new Promise<void>((resolve) => {
    if (videoElement.readyState >= HTMLMediaElement.HAVE_METADATA) {
      resolve();
      return;
    }

    const handleLoadedMetadata = () => {
      window.clearTimeout(timeoutId);
      resolve();
    };

    const timeoutId = window.setTimeout(() => {
      videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      resolve();
    }, 1000);

    videoElement.addEventListener("loadedmetadata", handleLoadedMetadata, { once: true });
  });

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

  const clearVideoElement = useCallback(() => {
    const videoElement = videoElementRef.current;

    if (!videoElement) return;

    videoElement.pause();
    videoElement.srcObject = null;
  }, []);

  const stopCamera = useCallback(
    (shouldResetState = true) => {
      if (streamRef.current) {
        console.info("[camera] Encerrando tracks ativos da câmera.");
        stopTracks(streamRef.current);
        streamRef.current = null;
      }

      clearVideoElement();

      if (shouldResetState && isMountedRef.current) {
        setCameraReady(false);
      }
    },
    [clearVideoElement],
  );

  const attachStreamToVideo = useCallback(async (stream: MediaStream, providedVideoElement?: HTMLVideoElement | null) => {
    const videoElement = providedVideoElement ?? videoElementRef.current;

    if (!videoElement) {
      console.warn("[camera] Elemento <video> ainda não está pronto para receber o stream.");
      return;
    }

    videoElement.autoplay = true;
    videoElement.muted = true;
    videoElement.playsInline = true;

    if (videoElement.srcObject !== stream) {
      videoElement.srcObject = stream;
      console.info("[camera] Stream vinculado ao srcObject do elemento de vídeo.");
    }

    try {
      await waitForVideoMetadata(videoElement);
      await videoElement.play();

      if (isMountedRef.current) {
        setCameraReady(true);
        setCameraError(null);
      }
    } catch (error) {
      const playError = error as DOMException;

      if (playError.name !== "AbortError") {
        console.error("[camera] Permissão concedida, mas o vídeo não conseguiu iniciar automaticamente.", playError);
      }

      if (isMountedRef.current) {
        setCameraReady(false);
        setCameraError("A câmera recebeu permissão, mas o vídeo não iniciou automaticamente.");
      }
    }
  }, []);

  const requestCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      console.error("[camera] navigator.mediaDevices.getUserMedia não está disponível neste navegador.");
      setHasMediaSupport(false);
      setCameraReady(false);
      setCameraError("Seu navegador não suporta acesso à câmera.");
      return;
    }

    if (isStartingRef.current) {
      console.info("[camera] Já existe uma solicitação de câmera em andamento.");
      return;
    }

    isStartingRef.current = true;
    setCameraReady(false);
    setCameraError(null);
    stopCamera(false);

    try {
      console.info("[camera] Solicitando permissão da câmera com getUserMedia.");
      const stream = await navigator.mediaDevices.getUserMedia(preferredCameraConstraints);
      const videoTrack = stream.getVideoTracks()[0];

      console.info("[camera] Stream recebido com sucesso.", {
        enabled: videoTrack?.enabled,
        label: videoTrack?.label,
        readyState: videoTrack?.readyState,
        settings: videoTrack?.getSettings?.(),
      });

      if (!isMountedRef.current) {
        stopTracks(stream);
        return;
      }

      streamRef.current = stream;
      await attachStreamToVideo(stream);
    } catch (error) {
      const mediaError = error as DOMException;

      if (mediaError.name === "NotFoundError") {
        console.error("[camera] NotFoundError: nenhuma câmera foi detectada no dispositivo.", mediaError);
        if (isMountedRef.current) {
          setCameraError("Nenhuma câmera detectada. Você pode tentar novamente.");
        }
      } else if (mediaError.name === "NotAllowedError") {
        console.error("[camera] NotAllowedError: o acesso à câmera foi negado ou bloqueado.", mediaError);
        if (isMountedRef.current) {
          setCameraError("Permissão de câmera negada. Clique em 'Ativar Câmera' para tentar novamente.");
        }
      } else {
        console.error("[camera] Falha ao iniciar a câmera.", mediaError);
        if (isMountedRef.current) {
          setCameraError("Não foi possível acessar a câmera agora. Tente novamente.");
        }
      }

      if (isMountedRef.current) {
        setCameraReady(false);
      }
    } finally {
      isStartingRef.current = false;
    }
  }, [attachStreamToVideo, stopCamera]);

  const setVideoElement: RefCallback<HTMLVideoElement> = useCallback(
    (node) => {
      videoElementRef.current = node;

      if (node && streamRef.current) {
        console.info("[camera] Reconectando stream existente ao elemento <video>.");
        void attachStreamToVideo(streamRef.current, node);
      }
    },
    [attachStreamToVideo],
  );

  useEffect(() => {
    const hasGetUserMediaSupport = !!navigator.mediaDevices?.getUserMedia;
    setHasMediaSupport(hasGetUserMediaSupport);
    console.info(`[camera] Suporte a getUserMedia: ${hasGetUserMediaSupport}`);

    if (!hasGetUserMediaSupport) {
      setCameraError("Seu navegador não suporta acesso à câmera.");
      return;
    }

    if (navigator.permissions?.query) {
      void navigator.permissions
        .query({ name: "camera" as PermissionName })
        .then((status) => {
          console.info(`[camera] Estado atual da permissão de câmera: ${status.state}`);
        })
        .catch((error) => {
          console.warn("[camera] Permissions API indisponível para câmera neste navegador.", error);
        });
    } else {
      console.info("[camera] Permissions API não disponível; tentando getUserMedia diretamente.");
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    void requestCamera();

    return () => {
      isMountedRef.current = false;
      stopCamera(false);
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
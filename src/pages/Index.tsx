import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Square, Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import VideoCapture from "@/components/VideoCapture";
import TranslationBox from "@/components/TranslationBox";
import { translateFromLibras } from "@/lib/gemini";

const Index = () => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationText, setTranslationText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isTranslatingRef = useRef(false);
  const translationRef = useRef("");

  const fetchNextTranslation = useCallback(async () => {
    if (!isTranslatingRef.current) return;
    setIsLoading(true);
    try {
      const result = await translateFromLibras(translationRef.current || undefined);
      if (!isTranslatingRef.current) return;
      const newText = translationRef.current
        ? `${translationRef.current} ${result}`
        : result;
      translationRef.current = newText;
      setTranslationText(newText);
    } catch (error) {
      console.error("Erro na tradução:", error);
      if (isTranslatingRef.current) {
        toast.error("Erro ao traduzir. Tentando novamente...");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isTranslating) return;
    
    // Fetch immediately, then every 4 seconds
    fetchNextTranslation();
    const interval = setInterval(fetchNextTranslation, 4000);
    return () => clearInterval(interval);
  }, [isTranslating, fetchNextTranslation]);

  const handleStart = useCallback(() => {
    isTranslatingRef.current = true;
    translationRef.current = "";
    setIsTranslating(true);
    setTranslationText("");
    toast.success("Tradução iniciada! Conectando ao Gemini AI...");
  }, []);

  const handleStop = useCallback(() => {
    isTranslatingRef.current = false;
    setIsTranslating(false);
    if (translationText) {
      toast.success("Tradução salva com sucesso!");
    } else {
      toast.info("Tradução encerrada.");
    }
  }, [translationText]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="w-full border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-3xl mx-auto flex items-center gap-3 py-4 px-4">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Hand className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">Tradutor de Libras</h1>
            <p className="text-xs text-muted-foreground">Tradução em tempo real de Língua Brasileira de Sinais</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6 animate-fade-in-up">
        <VideoCapture isActive={isTranslating} />

        <TranslationBox text={translationText} isActive={isTranslating} />

        {/* Action buttons */}
        <div className="flex gap-3 justify-center">
          {!isTranslating ? (
            <Button size="lg" onClick={handleStart} className="gap-2 px-8 text-base font-semibold shadow-md">
              <Play className="w-5 h-5" />
              Iniciar Tradução
            </Button>
          ) : (
            <Button size="lg" variant="destructive" onClick={handleStop} className="gap-2 px-8 text-base font-semibold shadow-md">
              <Square className="w-4 h-4" />
              Encerrar e Salvar
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;

import { useState, useEffect, useCallback } from "react";
import { Play, Square, Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import VideoCapture from "@/components/VideoCapture";
import TranslationBox from "@/components/TranslationBox";

const samplePhrases = [
  "Olá, tudo bem?",
  "Olá, tudo bem? Meu nome é João.",
  "Olá, tudo bem? Meu nome é João. Prazer em conhecê-lo.",
  "Olá, tudo bem? Meu nome é João. Prazer em conhecê-lo. Como posso ajudar?",
];

const Index = () => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationText, setTranslationText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    if (!isTranslating) return;
    const interval = setInterval(() => {
      setPhraseIndex((prev) => {
        const next = Math.min(prev + 1, samplePhrases.length - 1);
        setTranslationText(samplePhrases[next]);
        return next;
      });
    }, 2500);
    // Set first phrase immediately
    setTranslationText(samplePhrases[0]);
    return () => clearInterval(interval);
  }, [isTranslating]);

  const handleStart = useCallback(() => {
    setIsTranslating(true);
    setPhraseIndex(0);
    setTranslationText("");
    toast.success("Tradução iniciada!");
  }, []);

  const handleStop = useCallback(() => {
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

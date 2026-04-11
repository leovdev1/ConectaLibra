import { Languages } from "lucide-react";

interface TranslationBoxProps {
  text: string;
  isActive: boolean;
}

const TranslationBox = ({ text, isActive }: TranslationBoxProps) => {
  return (
    <div className="w-full rounded-lg border border-border bg-card p-6 shadow-sm min-h-[140px] relative">
      <div className="flex items-center gap-2 mb-3">
        <Languages className="w-5 h-5 text-primary" />
        <span className="text-sm font-semibold text-primary">Tradução em Tempo Real</span>
        {isActive && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-success font-medium">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Traduzindo...
          </span>
        )}
      </div>
      <p className="text-lg leading-relaxed text-foreground min-h-[60px]">
        {text || (
          <span className="text-muted-foreground italic">
            {isActive ? "Aguardando gestos..." : "A tradução aparecerá aqui"}
          </span>
        )}
      </p>
    </div>
  );
};

export default TranslationBox;

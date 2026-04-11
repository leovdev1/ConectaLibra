const GEMINI_API_KEY = "AIzaSyAOdmPFCffW094-k0HHOFjTks3zRjye09o";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const SYSTEM_PROMPT = `Você é um tradutor especializado em Língua Brasileira de Sinais (Libras).
Simule que você está observando uma pessoa fazendo sinais em Libras através de uma câmera.
Gere uma tradução realista e progressiva dos sinais observados.
Responda APENAS com o texto traduzido em português, sem explicações adicionais.
Cada resposta deve ser uma frase curta e natural, como se estivesse traduzindo em tempo real.
Varie as frases entre saudações, perguntas do dia-a-dia, pedidos de informação e conversas casuais.`;

export async function translateFromLibras(context?: string): Promise<string> {
  const userPrompt = context
    ? `Contexto anterior: "${context}". Agora traduza o próximo sinal observado, continuando a conversa de forma natural.`
    : "Traduza o primeiro sinal que você está observando. Comece com uma saudação ou apresentação.";

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        { role: "user", parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }] },
      ],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 100,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Gemini API error:", response.status, error);
    throw new Error(`Erro na API Gemini: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  
  if (!text) {
    throw new Error("Resposta vazia da API Gemini");
  }

  return text;
}

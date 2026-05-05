// src/lib/gemini.ts

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const SYSTEM_PROMPT = `Você é um tradutor especialista em Libras (Língua Brasileira de Sinais).
Analise a imagem da pessoa fazendo sinais e traduza para o português escrito.s
Regras estritas:
1. Responda APENAS com o texto da tradução.
2. Seja direto e use frases curtas.
3. Se não houver ninguém ou nenhum sinal claro, retorne um ponto final "." ou ignore.
4. Não use explicações como "A pessoa está dizendo...", apenas a tradução direta.`;

let isApiCallInProgress = false;
let lastCallTime = 0;
const MIN_INTERVAL = 2000; 

export async function translateFromLibras(base64Image: string) {
  const now = Date.now();
  
  // Evita chamadas duplicadas ou muito rápidas
  if (isApiCallInProgress || (now - lastCallTime < MIN_INTERVAL)) {
    return null;
  }

  if (!GEMINI_API_KEY || GEMINI_API_KEY === "" || GEMINI_API_KEY.includes("sua_chave")) {
    console.error("❌ Erro: API Key não configurada corretamente.");
    return "Erro: Configure a API Key";
  }

  isApiCallInProgress = true;
  lastCallTime = now;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: SYSTEM_PROMPT },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Image // Aqui entra a imagem capturada pelo VideoCapture
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1, // Reduzido para 0.1 para máxima precisão e menos "alucinação"
          maxOutputTokens: 50,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Detalhes do erro API:", errorData);
      throw new Error(`Erro API: ${response.status}`);
    }

    const data = await response.json();
    
    // Extrai o texto da resposta do Gemini
    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      const translation = data.candidates[0].content.parts[0].text.trim();
      // Filtra respostas vazias ou apenas pontuação
      return (translation === "." || translation === "...") ? null : translation;
    }
    
    return null;
  } catch (error) {
    console.error("❌ Erro na análise do Gemini:", error);
    return null;
  } finally {
    isApiCallInProgress = false;
  }
}
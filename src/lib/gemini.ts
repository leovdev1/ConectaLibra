// src/lib/gemini.ts

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// Corrigido para o modelo 2.0 que é o funcional
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const SYSTEM_PROMPT = `Você é um tradutor especializado em Libras. 
Simule que você está observando uma pessoa fazendo sinais. 
Gere uma tradução realista e progressiva dos sinais observados. 
Responda APENAS com o texto traduzido em português. 
Cada resposta deve ser uma frase curta e natural.`;

let isApiCallInProgress = false;
let lastCallTime = 0;
const MIN_INTERVAL = 2000; // Intervalo de 2 segundos para evitar travamentos

export async function translateFromLibras(base64Image: string) {
  const now = Date.now();
  
  if (isApiCallInProgress || (now - lastCallTime < MIN_INTERVAL)) {
    return null;
  }

  if (!GEMINI_API_KEY || GEMINI_API_KEY === "" || GEMINI_API_KEY.includes("sua_chave")) {
    console.error("❌ Erro: API Key não encontrada no arquivo .env");
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
                data: base64Image
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.4, // Menor temperatura para ser mais preciso na tradução
          maxOutputTokens: 100,
        }
      })
    });

    if (!response.ok) {
        throw new Error(`Erro API: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      return data.candidates[0].content.parts[0].text.trim();
    }
    
    return null;
  } catch (error) {
    console.error("❌ Erro na análise do Gemini:", error);
    return null;
  } finally {
    isApiCallInProgress = false;
  }
}
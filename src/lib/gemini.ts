const GEMINI_API_KEY = "AlzaSyAOdmPFCffW094-k0HHOFjTks3zRjyeO9o";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const SYSTEM_PROMPT = `Você é um tradutor especializado em Língua Brasileira de Sinais (Libras).
Simule que você está observando uma pessoa fazendo sinais em Libras através de uma câmera.
Gere uma tradução realista e progressiva dos sinais observados.
Responda APENAS com o texto traduzido em português, sem explicações adicionais.
Cada resposta deve ser uma frase curta e natural, como se estivesse traduzindo em tempo real.
Varie as frases entre saudações, perguntas do dia-a-dia, pedidos de informação e conversas casuais.`;

let isApiCallInProgress = false;

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 2): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);
    
    if (response.status === 429 && attempt < maxRetries) {
      const data = await response.json();
      const retryDelay = data?.error?.details?.find(
        (d: any) => d["@type"]?.includes("RetryInfo")
      )?.retryDelay;
      const waitSec = retryDelay ? parseInt(retryDelay) : 10;
      console.warn(`⚠️ Rate limited (429). Aguardando ${waitSec}s... (tentativa ${attempt + 1}/${maxRetries})`);
      await new Promise(r => setTimeout(r, waitSec * 1000));
      continue;
    }
    
    return response;
  }
  throw new Error("Máximo de tentativas excedido");
}

export async function translateFromLibras(context?: string): Promise<string> {
  if (isApiCallInProgress) {
    console.warn("⏳ Chamada já em progresso, ignorando...");
    return "";
  }

  isApiCallInProgress = true;

  try {
    const userPrompt = context
      ? `Contexto anterior: "${context}". Agora traduza o próximo sinal observado, continuando a conversa de forma natural.`
      : "Traduza o primeiro sinal que você está observando. Comece com uma saudação ou apresentação.";

    const requestBody = {
      contents: [
        { parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }] },
      ],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 150,
      },
    };

    const fullUrl = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;
    
    console.log("📡 Gemini API Request:", {
      model: "gemini-2.5-flash",
      hasContext: !!context,
    });

    const response = await fetchWithRetry(fullUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("❌ Gemini API Error:", { status: response.status, body: errorBody });
      
      if (response.status === 429) {
        throw new Error("Limite de requisições excedido. Aguarde alguns minutos.");
      }
      if (response.status === 403) {
        throw new Error("Chave API inválida ou sem permissão.");
      }
      
      throw new Error(`Erro na API Gemini: ${response.status}`);
    }

    const data = await response.json();
    
    console.log("✅ Gemini API Response:", {
      status: response.status,
      finishReason: data.candidates?.[0]?.finishReason,
    });

    if (data.candidates?.[0]?.finishReason === "SAFETY") {
      throw new Error("Resposta filtrada por segurança");
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) {
      throw new Error("Resposta vazia da API Gemini");
    }

    return text;
  } finally {
    isApiCallInProgress = false;
  }
}

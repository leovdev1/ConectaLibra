const GEMINI_API_KEY = "AIzaSyAOdmPFCffW094-k0HHOFjTks3zRjye09o";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const SYSTEM_PROMPT = `Você é um tradutor especializado em Língua Brasileira de Sinais (Libras).
Simule que você está observando uma pessoa fazendo sinais em Libras através de uma câmera.
Gere uma tradução realista e progressiva dos sinais observados.
Responda APENAS com o texto traduzido em português, sem explicações adicionais.
Cada resposta deve ser uma frase curta e natural, como se estivesse traduzindo em tempo real.
Varie as frases entre saudações, perguntas do dia-a-dia, pedidos de informação e conversas casuais.`;

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 2): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);
    
    if (response.status === 429 && attempt < maxRetries) {
      const data = await response.json();
      const retryDelay = data?.error?.details?.find(
        (d: any) => d["@type"]?.includes("RetryInfo")
      )?.retryDelay;
      const waitSec = retryDelay ? parseInt(retryDelay) : 10;
      console.warn(`⚠️ Gemini API rate limited (429). Aguardando ${waitSec}s antes de tentar novamente... (tentativa ${attempt + 1}/${maxRetries})`);
      await new Promise(r => setTimeout(r, waitSec * 1000));
      continue;
    }
    
    return response;
  }
  throw new Error("Máximo de tentativas excedido");
}

export async function translateFromLibras(context?: string): Promise<string> {
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
    url: GEMINI_API_URL,
    model: "gemini-2.5-flash",
    promptLength: userPrompt.length,
    hasContext: !!context,
  });

  const response = await fetchWithRetry(fullUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("❌ Gemini API Error:", {
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
    });
    
    if (response.status === 429) {
      throw new Error("Limite de requisições excedido. A chave API atingiu a quota do plano gratuito. Aguarde alguns minutos ou atualize o plano.");
    }
    if (response.status === 403) {
      throw new Error("Chave API inválida ou sem permissão. Verifique a chave no Google AI Studio.");
    }
    
    throw new Error(`Erro na API Gemini: ${response.status} - ${response.statusText}`);
  }

  const data = await response.json();
  
  console.log("✅ Gemini API Response:", {
    status: response.status,
    finishReason: data.candidates?.[0]?.finishReason,
    hasContent: !!data.candidates?.[0]?.content?.parts?.[0]?.text,
  });

  const finishReason = data.candidates?.[0]?.finishReason;
  if (finishReason === "SAFETY") {
    console.warn("⚠️ Resposta filtrada por segurança do Gemini");
    throw new Error("Resposta filtrada por configurações de segurança");
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  
  if (!text) {
    console.error("❌ Resposta vazia:", JSON.stringify(data, null, 2));
    throw new Error("Resposta vazia da API Gemini");
  }

  return text;
}

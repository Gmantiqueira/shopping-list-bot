import OpenAI from 'openai';

/**
 * Valida e limpa a resposta do LLM
 */
function parseLLMResponse(response: string): string[] {
  try {
    // Tenta fazer parse do JSON
    const parsed = JSON.parse(response.trim());

    // Aceita só array
    if (!Array.isArray(parsed)) {
      return [];
    }

    // Filtra apenas strings, faz trim e remove vazios
    const items = parsed
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    // Limita a 20 itens
    return items.slice(0, 20);
  } catch (error) {
    // Em caso de erro, retorna array vazio
    return [];
  }
}

/**
 * Cria o prompt para extração de itens
 */
function createPrompt(text: string): string {
  return `Você é um assistente que extrai itens de supermercado de mensagens em português.

INSTRUÇÕES:
- Extraia APENAS itens de supermercado mencionados na mensagem
- Retorne SOMENTE um JSON válido: um array de strings
- NÃO invente itens que não foram mencionados
- IGNORE frases que não sejam pedido de compra (ex: "vou no mercado", "alguém precisa de algo?")
- Se não houver itens de compra, retorne []
- Preserve quantidades quando mencionadas (ex: "2kg batata")
- Cada item deve ser uma string no array

EXEMPLOS:

Mensagem: "leite maçã coca-cola"
Resposta: ["leite","maçã","coca-cola"]

Mensagem: "acabou o leite e pega pão também"
Resposta: ["leite","pão"]

Mensagem: "vou no mercado agora"
Resposta: []

Mensagem: "alguém precisa de algo?"
Resposta: []

Mensagem: "2kg batata e 3 coca"
Resposta: ["2kg batata","3 coca"]

Mensagem: "${text}"
Resposta:`;
}

/**
 * Extrai itens de uma mensagem usando OpenAI LLM
 */
export async function extractItemsByLLM(text: string): Promise<string[]> {
  // Verifica se LLM está habilitado
  const enableLLM = process.env.ENABLE_LLM_ITEM_EXTRACTION === 'true';
  if (!enableLLM) {
    return [];
  }

  // Verifica se API key está configurada
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('OPENAI_API_KEY not configured, skipping LLM extraction');
    return [];
  }

  // Modelo padrão: gpt-4o-mini (mais barato e rápido)
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  try {
    const client = new OpenAI({ apiKey });

    // Timeout de 10 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const completion = await client.chat.completions.create(
      {
        model,
        messages: [
          {
            role: 'system',
            content:
              'Você é um assistente que extrai itens de supermercado. Retorne APENAS JSON válido: um array de strings.',
          },
          {
            role: 'user',
            content: createPrompt(text),
          },
        ],
        temperature: 0.1, // Baixa temperatura para respostas mais determinísticas
        max_tokens: 500, // Limite razoável para arrays de itens
      },
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      return [];
    }

    // Tenta extrair JSON da resposta (pode vir com markdown code blocks)
    let jsonText = responseText.trim();
    // Remove markdown code blocks se houver
    jsonText = jsonText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '');
    jsonText = jsonText.replace(/\s*```$/i, '').trim();

    // Valida que a resposta é um array direto
    try {
      const parsed = JSON.parse(jsonText);
      // Aceita apenas arrays diretos
      if (!Array.isArray(parsed)) {
        return [];
      }
      // Se for array, processa diretamente
      return parseLLMResponse(jsonText);
    } catch (error) {
      // Se não conseguir fazer parse, retorna vazio
      return [];
    }
  } catch (error) {
    // Trata erros sem quebrar o app
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.warn('LLM extraction timeout');
      } else {
        console.warn('LLM extraction error:', error.message);
      }
    }
    return [];
  }
}

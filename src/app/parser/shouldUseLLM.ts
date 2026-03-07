/**
 * Conta palavras em um texto
 */
function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Verifica se a mensagem tem verbos de compra
 */
function hasShoppingVerbs(text: string): boolean {
  const normalized = text.toLowerCase();
  const shoppingVerbs = [
    /\bcompra\b/,
    /\bcomprar\b/,
    /\bpega\b/,
    /\bpegar\b/,
    /\bprecisa\b/,
    /\bpreciso\b/,
    /\bacabou\b/,
    /\btraz\b/,
    /\btrazer\b/,
  ];

  return shoppingVerbs.some((verb) => verb.test(normalized));
}

/**
 * Decide se deve usar LLM para extração de itens
 * @param text - Texto da mensagem original
 * @param ruleItems - Itens extraídos por regras
 * @returns true se deve usar LLM, false caso contrário
 */
export function shouldUseLLM(text: string, ruleItems: string[]): boolean {
  const trimmed = text.trim();

  // 1. NÃO usar LLM se houver múltiplas linhas
  if (trimmed.split('\n').length > 1) {
    return false;
  }

  // 2. NÃO usar LLM se houver vírgula
  if (trimmed.includes(',')) {
    return false;
  }

  // 3. NÃO usar LLM se ruleItems já tiver 2 ou mais itens
  if (ruleItems.length >= 2) {
    return false;
  }

  // 4. NÃO usar LLM se mensagem tiver menos de 3 palavras
  const wordCount = countWords(trimmed);
  if (wordCount < 3) {
    return false;
  }

  // 5. Usar LLM se ruleItems tiver 0 itens
  if (ruleItems.length === 0) {
    return true;
  }

  // 6. Usar LLM se ruleItems tiver 1 item, mas mensagem tiver 3 ou mais palavras
  if (ruleItems.length === 1 && wordCount >= 3) {
    return true;
  }

  // 7. Usar LLM se mensagem tiver verbos de compra e extração ficou ambígua
  // (1 item extraído mas mensagem tem verbos de compra)
  if (ruleItems.length === 1 && hasShoppingVerbs(trimmed)) {
    return true;
  }

  return false;
}

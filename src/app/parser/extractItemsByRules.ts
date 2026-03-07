/**
 * Termos compostos comuns que não devem ser quebrados
 */
const COMPOUND_TERMS = [
  'coca-cola',
  'papel toalha',
  'molho de tomate',
  'água de coco',
  'leite condensado',
  'açúcar cristal',
  'farinha de trigo',
  'fermento em pó',
  'óleo de soja',
  'manteiga de garrafa',
];

/**
 * Limpa um item: trim e remove pontuação sobrando no começo/fim
 */
function cleanItem(item: string): string {
  return item
    .trim()
    .replace(/^[.,;:!?]+/, '') // Remove pontuação no começo
    .replace(/[.,;:!?]+$/, '') // Remove pontuação no fim
    .trim();
}

/**
 * Verifica se o texto contém termos compostos
 */
function hasCompoundTerms(text: string): boolean {
  const lower = text.toLowerCase();
  return COMPOUND_TERMS.some((term) => lower.includes(term));
}

/**
 * Extrai itens de uma mensagem usando regras simples
 */
export function extractItemsByRules(text: string): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const trimmed = text.trim();

  // 1. Múltiplas linhas: cada linha relevante vira item
  const lines = trimmed
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length > 1) {
    return lines.map(cleanItem).filter((item) => item.length > 0);
  }

  // 2. Vírgulas: separar por vírgula
  if (trimmed.includes(',')) {
    const items = trimmed
      .split(',')
      .map(cleanItem)
      .filter((item) => item.length > 0);
    if (items.length > 1) {
      return items;
    }
  }

  // 3. Conectores claros: " e ", " + ", " / ", "&"
  // Só divide se não for uma frase complexa com verbos de ação
  const actionVerbPattern =
    /\b(preciso|precisar|vou|vai|fazer|fazendo|comprar|comprando|pegar|pegando|trazer|trazendo|para|com|de)\b/i;
  const hasActionVerbs = actionVerbPattern.test(trimmed);

  const connectorPattern = /\s+(e|\+|\/|&)\s+/gi;
  if (connectorPattern.test(trimmed) && !hasActionVerbs) {
    // Usa split com regex para dividir pelos conectores
    const parts = trimmed.split(/\s+(?:e|\+|\/|&)\s+/i);
    if (parts.length > 1) {
      return parts.map(cleanItem).filter((item) => item.length > 0);
    }
  }

  // 4. Se contém termos compostos conhecidos, não quebrar
  if (hasCompoundTerms(trimmed)) {
    return [cleanItem(trimmed)];
  }

  // 5. Se não conseguir extrair com clareza, retornar no máximo 1 item bruto
  return [cleanItem(trimmed)];
}

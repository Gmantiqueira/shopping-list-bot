/**
 * Normaliza texto para comparação
 */
function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Detecta se a mensagem é um comando de aprendizado de alias
 */
export function detectAliasLearning(
  text: string
): { raw: string; canonical: string } | null {
  const trimmed = text.trim();

  // Padrões de aprendizado de alias (ordem importa - mais específicos primeiro)
  const patterns = [
    // "corrigir refri -> coca-cola" (mais específico, testa primeiro)
    /^corrigir\s+(.+?)\s*->\s*(.+)$/i,
    // "refri -> coca-cola" (padrão genérico com seta)
    /^(.+?)\s*->\s*(.+)$/i,
    // "refri é coca-cola"
    /^(.+?)\s+é\s+(.+)$/i,
    // "refri significa coca-cola"
    /^(.+?)\s+significa\s+(.+)$/i,
    // "refri = coca-cola" (mais genérico, testa por último)
    /^(.+?)\s*=\s*(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) {
      const raw = normalize(match[1]);
      const canonical = normalize(match[2]);

      // Rejeitar se raw ou canonical ficarem vazios
      if (!raw || !canonical) {
        return null;
      }

      // Rejeitar se raw e canonical forem iguais
      if (raw === canonical) {
        return null;
      }

      // Rejeitar se qualquer lado tiver mais de 80 caracteres
      if (raw.length > 80 || canonical.length > 80) {
        return null;
      }

      return { raw, canonical };
    }
  }

  return null;
}

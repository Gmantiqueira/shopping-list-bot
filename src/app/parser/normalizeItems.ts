import { applyAlias } from './shoppingAliases.js';

/**
 * Normaliza um item individual
 */
function normalizeItem(item: string): string {
  // 1. Trim
  let normalized = item.trim();

  // 2. Lowercase
  normalized = normalized.toLowerCase();

  // 3. Remover espaços duplicados
  normalized = normalized.replace(/\s+/g, ' ');

  // 4. Padronizar hífens e espaços (normaliza hífens com espaços)
  normalized = normalized.replace(/\s*-\s*/g, '-');

  // 5. Remover pontuação inicial e final inútil (mantém hífens no meio)
  normalized = normalized.replace(/^[.,;:!?]+/, ''); // Remove no começo
  normalized = normalized.replace(/[.,;:!?]+$/, ''); // Remove no fim

  // 6. Trim novamente após normalizações
  normalized = normalized.trim();

  // 7. Aplicar aliases
  normalized = applyAlias(normalized);

  // 8. Limitar a 80 caracteres
  if (normalized.length > 80) {
    normalized = normalized.substring(0, 80).trim();
  }

  return normalized;
}

/**
 * Normaliza uma lista de itens
 */
export function normalizeItems(items: string[]): string[] {
  // 1. Normaliza cada item
  const normalized = items.map(normalizeItem);

  // 2. Remove itens vazios
  const nonEmpty = normalized.filter((item) => item.length > 0);

  // 3. Remove duplicados preservando ordem
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const item of nonEmpty) {
    if (!seen.has(item)) {
      seen.add(item);
      unique.push(item);
    }
  }

  return unique;
}

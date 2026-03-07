import type { ShoppingItem } from './types.js';

/**
 * Extrai quantidade e unidade de um texto de item
 * Exemplos:
 * - "2 leite" -> { name: "leite", quantity: 2, unit: "un" }
 * - "2kg batata" -> { name: "batata", quantity: 2, unit: "kg" }
 * - "leite" -> { name: "leite", quantity: 1, unit: "un" }
 * - "3 coca" -> { name: "coca", quantity: 3, unit: "un" }
 */
export function parseItemText(text: string): ShoppingItem {
  const trimmed = text.trim();

  // Padrão: número seguido de unidade (opcional) seguido de nome
  // Ex: "2kg batata", "3 un leite", "2 leite"
  const patternWithUnit = /^(\d+(?:[.,]\d+)?)\s*([a-záàâãéêíóôõúç]+)?\s+(.+)$/i;
  const matchWithUnit = trimmed.match(patternWithUnit);

  if (matchWithUnit) {
    const quantityStr = matchWithUnit[1].replace(',', '.');
    const quantity = parseFloat(quantityStr);
    const possibleUnit = matchWithUnit[2]?.toLowerCase().trim();
    const name = matchWithUnit[3].trim();

    // Se o segundo grupo parece uma unidade conhecida, usa ela
    // Caso contrário, assume que é parte do nome
    const knownUnits = [
      'kg',
      'g',
      'l',
      'ml',
      'un',
      'unidade',
      'unidades',
      'pacote',
      'pacotes',
      'caixa',
      'caixas',
      'garrafa',
      'garrafas',
      'lata',
      'latas',
      'dúzia',
      'dúzias',
    ];

    if (possibleUnit && knownUnits.includes(possibleUnit)) {
      return {
        name,
        quantity,
        unit: normalizeUnit(possibleUnit),
      };
    } else {
      // Se não for unidade conhecida, assume que é parte do nome
      return {
        name: `${possibleUnit || ''} ${name}`.trim(),
        quantity,
        unit: 'un',
      };
    }
  }

  // Padrão: apenas número no início (sem unidade explícita)
  // Ex: "2 leite", "3 arroz"
  const patternNumberOnly = /^(\d+(?:[.,]\d+)?)\s+(.+)$/i;
  const matchNumberOnly = trimmed.match(patternNumberOnly);

  if (matchNumberOnly) {
    const quantityStr = matchNumberOnly[1].replace(',', '.');
    const quantity = parseFloat(quantityStr);
    const name = matchNumberOnly[2].trim();

    return {
      name,
      quantity,
      unit: 'un',
    };
  }

  // Sem quantidade: assume 1 unidade
  return {
    name: trimmed,
    quantity: 1,
    unit: 'un',
  };
}

/**
 * Normaliza unidade para formato padrão
 */
function normalizeUnit(unit: string): string {
  const normalized = unit.toLowerCase().trim();

  // Mapeamentos de unidades
  const unitMap: Record<string, string> = {
    unidade: 'un',
    unidades: 'un',
    pacote: 'un',
    pacotes: 'un',
    caixa: 'un',
    caixas: 'un',
    garrafa: 'un',
    garrafas: 'un',
    lata: 'un',
    latas: 'un',
    dúzia: 'un',
    dúzias: 'un',
  };

  return unitMap[normalized] || normalized;
}

/**
 * Formata item para exibição
 * Exemplos:
 * - { name: "leite", quantity: 2, unit: "un" } -> "2 leite"
 * - { name: "batata", quantity: 2, unit: "kg" } -> "2 kg batata"
 * - { name: "arroz", quantity: 1, unit: "un" } -> "1 arroz"
 */
export function formatItem(
  item: ShoppingItem | { name: string; quantity?: number; unit?: string }
): string {
  const quantity = item.quantity ?? 1;
  const unit = item.unit ?? 'un';

  // Se for unidade padrão (un), não mostra a unidade
  if (unit === 'un') {
    return `${quantity} ${item.name}`;
  }

  return `${quantity} ${unit} ${item.name}`;
}

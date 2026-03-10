import type { ShoppingItem } from '../../domain/types.js';

const LOW_CONFIDENCE_PHRASES = [
  'oi',
  'ok',
  'okay',
  'sim',
  'não',
  'nao',
  'bom dia',
  'boa tarde',
  'boa noite',
  'obrigado',
  'obrigada',
  'valeu',
  'tchau',
  'beleza',
  'tá bom',
];

function normalizeForCompare(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Retorna score de confiança entre 0 e 1 para uma mensagem interpretada como itens.
 */
export function computeItemConfidence(
  rawText: string,
  items: ShoppingItem[]
): number {
  const trimmed = rawText.trim();
  const normalized = normalizeForCompare(trimmed);

  if (trimmed.length < 3) {
    return 0.2;
  }

  if (LOW_CONFIDENCE_PHRASES.includes(normalized)) {
    return 0.25;
  }

  if (items.length > 1) {
    return 0.85;
  }

  const hasExplicitQuantity = items.some(
    (i) => (i.quantity ?? 1) !== 1 || (i.unit ?? 'un') !== 'un'
  );
  if (hasExplicitQuantity) {
    return 0.9;
  }

  const singleWord = trimmed.split(/\s+/).length <= 1;
  if (singleWord) {
    return 0.5;
  }

  return 0.65;
}

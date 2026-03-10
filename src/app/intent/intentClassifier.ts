import type { IntentResult } from './intentTypes.js';

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

const SHOW_LIST_PHRASES = [
  'ver lista',
  'mostrar lista',
  'lista',
  'ver a lista',
  'mostrar a lista',
  'qual a lista',
  'minha lista',
];

const FINALIZE_LIST_PHRASES = [
  'finalizar pedido',
  'fechar lista',
  'finalizar lista',
  'fechar pedido',
  'concluir lista',
  'concluir pedido',
];

const SMALL_TALK_PHRASES = [
  'oi',
  'olá',
  'ola',
  'bom dia',
  'boa tarde',
  'boa noite',
  'ok',
  'okay',
  'tá bom',
  'ta bom',
  'beleza',
  'tchau',
  'obrigado',
  'obrigada',
  'valeu',
  'até',
  'ate',
  'kkk',
  'kkkk',
  'haha',
  'rs',
  'rsrs',
];

/** "tirar banana" / "remover leite" / "tirar o leite" */
const REMOVE_PREFIXES = [/^tirar\s+(?:o\s+|a\s+)?(.+)$/i, /^remover\s+(?:o\s+|a\s+)?(.+)$/i];

/** "- banana" / "-banana" (já tratado pelo parser como COMMAND_REMOVE; classificador pode retornar REMOVE_ITEM com nome) */
function matchRemoveWithPrefix(text: string): { intent: 'REMOVE_ITEM'; itemName: string } | null {
  const n = normalize(text);
  for (const re of REMOVE_PREFIXES) {
    const m = n.match(re);
    if (m && m[1].trim()) return { intent: 'REMOVE_ITEM', itemName: m[1].trim() };
  }
  const dashMatch = text.match(/^-\s*(.+)$/i);
  if (dashMatch && dashMatch[1].trim()) {
    return { intent: 'REMOVE_ITEM', itemName: dashMatch[1].trim() };
  }
  return null;
}

/**
 * Classifica a intenção da mensagem (primeira etapa do pipeline).
 * Ordem: SHOW_LIST, FINALIZE_LIST, REMOVE_ITEM, SMALL_TALK, ADD_ITEM, UNKNOWN.
 */
export function classifyIntent(text: string): IntentResult {
  if (!text || text.trim().length === 0) {
    return { intent: 'UNKNOWN' };
  }

  const n = normalize(text);

  if (SHOW_LIST_PHRASES.includes(n)) {
    return { intent: 'SHOW_LIST' };
  }

  if (FINALIZE_LIST_PHRASES.includes(n)) {
    return { intent: 'FINALIZE_LIST' };
  }

  const remove = matchRemoveWithPrefix(text);
  if (remove) {
    return { intent: 'REMOVE_ITEM', itemName: remove.itemName };
  }

  if (SMALL_TALK_PHRASES.includes(n)) {
    return { intent: 'SMALL_TALK' };
  }

  // "limpar lista", "aliases", "check X" seguem para parseMessage (retornam command ou items)
  // Candidato a item: resto
  return { intent: 'ADD_ITEM' };
}

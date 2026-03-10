/**
 * Intenções obrigatórias do fluxo de mensagens.
 */
export type Intent =
  | 'ADD_ITEM'
  | 'REMOVE_ITEM'
  | 'SHOW_LIST'
  | 'FINALIZE_LIST'
  | 'SMALL_TALK'
  | 'UNKNOWN';

export interface IntentResult {
  intent: Intent;
  /** Para REMOVE_ITEM: nome do item extraído (ex.: "tirar banana" -> "banana"). */
  itemName?: string;
}

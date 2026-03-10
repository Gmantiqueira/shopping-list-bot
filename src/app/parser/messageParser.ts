import type { ParseInput, ParseResult } from './types.js';
import type { ShoppingItem } from '../../domain/types.js';
import { parseItemText } from '../../domain/itemUtils.js';

export class MessageParser {
  parse(input: ParseInput): ParseResult {
    const { text } = input;

    // IGNORE: mensagem vazia ou apenas espaços
    if (!text || text.trim().length === 0) {
      return { type: 'IGNORE' };
    }

    const trimmedText = text.trim();

    // IGNORE: mensagem muito longa (> 120 chars)
    if (trimmedText.length > 120) {
      return { type: 'IGNORE' };
    }

    // COMMAND_LIST: "lista"
    if (trimmedText.toLowerCase() === 'lista') {
      return { type: 'COMMAND_LIST' };
    }

    // COMMAND_CLEAR: "limpar lista"
    if (trimmedText.toLowerCase() === 'limpar lista') {
      return { type: 'COMMAND_CLEAR' };
    }

    // COMMAND_REMOVE: "- <item>" ou "-<item>"
    const removeMatch = trimmedText.match(/^-\s*(.+)$/i);
    if (removeMatch) {
      const itemName = removeMatch[1].trim();
      if (itemName.length > 0) {
        return { type: 'COMMAND_REMOVE', name: itemName };
      }
    }

    // COMMAND_BOUGHT: "✔ <item>" ou "check <item>"
    const checkMatch = trimmedText.match(/^(?:✔|check)\s+(.+)$/i);
    if (checkMatch) {
      const itemName = checkMatch[1].trim();
      if (itemName.length > 0) {
        return { type: 'COMMAND_BOUGHT', name: itemName };
      }
    }

    // ITEMS: múltiplas linhas ou linha única curta
    const lines = trimmedText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // Se tiver múltiplas linhas, cada linha vira um item
    if (lines.length > 1) {
      const items: ShoppingItem[] = lines.map((line) => parseItemText(line));
      return { type: 'ITEMS', items, confidence: 0.7 };
    }

    // Se for 1 linha curta (até 60 chars) vira item único
    if (lines.length === 1 && lines[0].length <= 60) {
      const items: ShoppingItem[] = [parseItemText(lines[0])];
      return { type: 'ITEMS', items, confidence: 0.7 };
    }

    // Linha única muito longa (> 60 e <= 120) -> IGNORE
    return { type: 'IGNORE' };
  }
}

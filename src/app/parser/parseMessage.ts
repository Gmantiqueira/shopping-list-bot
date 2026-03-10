import type { ParseInput, ParseResult } from './types.js';
import type { ShoppingItem } from '../../domain/types.js';
import { detectAliasLearning } from './detectAliasLearning.js';
import { detectNameRegistration } from './detectNameRegistration.js';
import { classifyMessage } from './classifyMessage.js';
import { extractItemsByRules } from './extractItemsByRules.js';
import { shouldUseLLM } from './shouldUseLLM.js';
import { extractItemsByLLM } from './extractItemsByLLM.js';
import { normalizeItems } from './normalizeItems.js';
import { applyLearnedAliasesToItems } from './applyLearnedAliases.js';
import { parseItemText } from '../../domain/itemUtils.js';
import { createMessageParseEventRepository } from '../../infra/messageParseEventFactory.js';
import { computeItemConfidence } from './computeItemConfidence.js';

/**
 * Verifica se debug está habilitado
 */
function isDebugEnabled(): boolean {
  return process.env.PARSER_DEBUG === 'true';
}

/**
 * Log de debug do parser
 */
function debugLog(message: string, data?: unknown): void {
  if (isDebugEnabled()) {
    if (data !== undefined) {
      console.log(`[PARSER DEBUG] ${message}`, JSON.stringify(data, null, 2));
    } else {
      console.log(`[PARSER DEBUG] ${message}`);
    }
  }
}

/**
 * Detecta se a mensagem é um comando
 */
function detectCommand(text: string): ParseResult | null {
  const trimmed = text.trim().toLowerCase();

  // COMMAND_LIST: "lista"
  if (trimmed === 'lista') {
    return { type: 'COMMAND_LIST' };
  }

  // COMMAND_CLEAR: "limpar lista"
  if (trimmed === 'limpar lista') {
    return { type: 'COMMAND_CLEAR' };
  }

  // COMMAND_LIST_ALIASES: "aliases", "vocabulário", "vocabulario"
  if (
    trimmed === 'aliases' ||
    trimmed === 'vocabulário' ||
    trimmed === 'vocabulario'
  ) {
    return { type: 'COMMAND_LIST_ALIASES' };
  }

  // COMMAND_REMOVE: "- <item>" ou "-<item>"
  const removeMatch = text.match(/^-\s*(.+)$/i);
  if (removeMatch) {
    const itemName = removeMatch[1].trim();
    if (itemName.length > 0) {
      return { type: 'COMMAND_REMOVE', name: itemName };
    }
  }

  // COMMAND_BOUGHT: "✔ <item>" ou "check <item>"
  const checkMatch = text.match(/^(?:✔|check)\s+(.+)$/i);
  if (checkMatch) {
    const itemName = checkMatch[1].trim();
    if (itemName.length > 0) {
      return { type: 'COMMAND_BOUGHT', name: itemName };
    }
  }

  return null;
}

/**
 * Pipeline híbrido de parsing de mensagens
 */
export async function parseMessage(input: ParseInput): Promise<ParseResult> {
  const { text } = input;

  // 1. IGNORE: mensagem vazia ou apenas espaços
  if (!text || text.trim().length === 0) {
    saveParseEvent(input, {
      ruleItems: [],
      finalItems: [],
      usedLlm: false,
      status: 'ignored',
    }).catch(() => {
      // Ignora erros silenciosamente para mensagens vazias
    });
    return { type: 'IGNORE' };
  }

  const trimmed = text.trim();

  // 2. IGNORE: mensagem muito longa (> 300 chars)
  if (trimmed.length > 300) {
    saveParseEvent(input, {
      ruleItems: [],
      finalItems: [],
      usedLlm: false,
      status: 'ignored',
    }).catch(() => {
      // Ignora erros silenciosamente
    });
    return { type: 'IGNORE' };
  }

  // 3. Detectar cadastro de nome (antes de alias e parser de itens)
  const nameForRegistration = detectNameRegistration(trimmed);
  if (nameForRegistration) {
    return { type: 'NAME_REGISTRATION', name: nameForRegistration };
  }

  // 4. Detectar aprendizado de alias (antes de comandos normais)
  const aliasLearning = detectAliasLearning(trimmed);
  if (aliasLearning) {
    return {
      type: 'ALIAS_LEARN',
      raw: aliasLearning.raw,
      canonical: aliasLearning.canonical,
    };
  }

  // 5. Detectar comando
  const command = detectCommand(trimmed);
  if (command) {
    // Comandos não são salvos como eventos de parsing
    return command;
  }

  // 6. Classificar intenção
  const intent = classifyMessage(trimmed);
  debugLog('Intent classified', { intent, text: trimmed });

  // 6. Se CHAT ou IGNORE, retornar IGNORE
  if (intent === 'CHAT' || intent === 'IGNORE') {
    debugLog('Message ignored (CHAT or IGNORE intent)');

    // Salvar evento de parsing (não bloqueia o fluxo)
    saveParseEvent(input, {
      ruleItems: [],
      finalItems: [],
      usedLlm: false,
      status: 'ignored',
    }).catch((error) => {
      console.warn('Failed to save parse event:', error);
    });

    return { type: 'IGNORE' };
  }

  // 7. Extrair itens por regras
  const ruleItems = extractItemsByRules(trimmed);
  debugLog('Items extracted by rules', { ruleItems, count: ruleItems.length });

  // 8. Decidir se usa LLM
  const useLLM = shouldUseLLM(trimmed, ruleItems);
  debugLog('LLM decision', { shouldUseLLM: useLLM });

  let finalItems: string[] = ruleItems;
  let llmUsed = false;
  let llmFailed = false;
  let llmItems: string[] | undefined = undefined;

  // 9. Se deve usar LLM e feature flag ativa, tentar extrair com LLM
  if (useLLM && process.env.ENABLE_LLM_ITEM_EXTRACTION === 'true') {
    try {
      debugLog('Calling LLM for item extraction');
      llmItems = await extractItemsByLLM(trimmed);
      debugLog('LLM response received', {
        llmItems,
        count: llmItems.length,
      });
      // Se LLM retornou itens, usar eles; senão, usar ruleItems como fallback
      if (llmItems.length > 0) {
        finalItems = llmItems;
        llmUsed = true;
        debugLog('Using LLM items', { items: finalItems });
      } else {
        debugLog('LLM returned empty, using rule-based items as fallback');
      }
    } catch (error) {
      // Em caso de erro, usar ruleItems como fallback
      llmFailed = true;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      debugLog('LLM extraction failed, using rule-based items as fallback', {
        error: errorMessage,
      });
      console.warn('LLM extraction failed, using rule-based items:', error);
    }
  }

  // 10. Normalizar itens
  const normalizedItems = normalizeItems(finalItems);
  debugLog('Items normalized', {
    before: finalItems,
    after: normalizedItems,
    llmUsed,
    llmFailed,
  });

  // 11. Deduplicar strings de itens
  const seen = new Set<string>();
  const uniqueItems: string[] = [];
  for (const item of normalizedItems) {
    if (!seen.has(item)) {
      seen.add(item);
      uniqueItems.push(item);
    }
  }
  debugLog('Items deduplicated', {
    before: normalizedItems,
    after: uniqueItems,
  });

  // 12. Se não houver itens, retornar IGNORE
  if (uniqueItems.length === 0) {
    debugLog('No items after deduplication, returning IGNORE');

    // Salvar evento de parsing (não bloqueia o fluxo)
    saveParseEvent(input, {
      ruleItems,
      llmItems,
      finalItems: [],
      usedLlm: llmUsed,
      status: 'ignored',
    }).catch((error) => {
      console.warn('Failed to save parse event:', error);
    });

    return { type: 'IGNORE' };
  }

  // 13. Converter strings para ShoppingItem
  let shoppingItems: ShoppingItem[] = uniqueItems.map((itemText) =>
    parseItemText(itemText)
  );

  // 14. Normalizar nomes usando aliases (ex.: "refri" -> "refrigerante", "coca" -> "coca cola")
  shoppingItems = await applyLearnedAliasesToItems(input.groupId, shoppingItems);
  debugLog('Item names normalized by aliases', {
    items: shoppingItems.map((i) => i.name),
  });

  const confidence = computeItemConfidence(trimmed, shoppingItems);
  debugLog('Final result', {
    type: 'ITEMS',
    items: shoppingItems,
    count: shoppingItems.length,
    confidence,
  });

  // 15. Salvar evento de parsing (não bloqueia o fluxo)
  saveParseEvent(input, {
    ruleItems,
    llmItems,
    finalItems: uniqueItems,
    usedLlm: llmUsed,
    status: 'accepted',
  }).catch((error) => {
    console.warn('Failed to save parse event:', error);
  });

  return { type: 'ITEMS', items: shoppingItems, confidence };
}

/**
 * Salva evento de parsing de forma assíncrona e não bloqueante
 */
async function saveParseEvent(
  input: ParseInput,
  data: {
    ruleItems: string[];
    llmItems?: string[];
    finalItems: string[];
    usedLlm: boolean;
    status: 'accepted' | 'ignored' | 'failed';
  }
): Promise<void> {
  try {
    const repository = createMessageParseEventRepository();
    if (!repository) {
      // Se não há repositório (MEMORY mode), não salva
      return;
    }

    await repository.save({
      groupId: input.groupId,
      userId: input.userId,
      rawText: input.text,
      ruleItems: data.ruleItems,
      llmItems: data.llmItems,
      finalItems: data.finalItems,
      usedLlm: data.usedLlm,
      status: data.status,
    });
  } catch (error) {
    // Loga erro mas não quebra o fluxo
    console.warn('Error saving parse event:', error);
  }
}

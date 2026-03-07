export type MessageIntent =
  | 'COMMAND'
  | 'SHOPPING_CANDIDATE'
  | 'CHAT'
  | 'IGNORE';

/**
 * Normaliza texto para comparação (trim, lowercase, remove espaços duplicados)
 */
function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Verifica se a mensagem é um comando conhecido
 */
function isCommand(text: string): boolean {
  const normalized = normalize(text);

  // Comandos exatos
  if (normalized === 'lista' || normalized === 'limpar lista') {
    return true;
  }

  // Comandos que começam com prefixos específicos
  if (
    normalized.startsWith('- ') ||
    normalized.startsWith('-') ||
    normalized.startsWith('✔ ') ||
    normalized.startsWith('check ')
  ) {
    return true;
  }

  return false;
}

/**
 * Verifica se a mensagem parece ser conversa normal
 */
function isChat(text: string): boolean {
  const normalized = normalize(text);

  // Saudações e expressões comuns
  const commonChatPhrases = [
    'bom dia',
    'boa tarde',
    'boa noite',
    'obrigado',
    'obrigada',
    'valeu',
    'ok',
    'okay',
    'tá bom',
    'beleza',
    'tchau',
    'até',
    'kkkk',
    'kkk',
    'haha',
    'rs',
    'rsrs',
    'preciso de ajuda',
    'qual mercado',
    'quando você vai',
    'quando voce vai',
  ];

  if (commonChatPhrases.includes(normalized)) {
    return true;
  }

  // Padrões de conversa sobre mercado/compra
  const chatPatterns = [
    /vou no mercado/i,
    /to indo no mercado/i,
    /indo no mercado/i,
    /alguém precisa de algo/i,
    /alguem precisa de algo/i,
    /quem vai comprar/i,
    /já compraram/i,
    /ja compraram/i,
    /quer que eu compre/i,
    /vou passar no mercado/i,
    /alguem quer algo do mercado/i,
    /alguém quer algo do mercado/i,
    /qual mercado/i,
    /quando você vai/i,
    /quando voce vai/i,
  ];

  return chatPatterns.some((pattern) => pattern.test(normalized));
}

/**
 * Verifica se a mensagem deve ser ignorada
 */
function shouldIgnore(text: string): boolean {
  // Vazia
  if (!text || text.trim().length === 0) {
    return true;
  }

  // Muito longa
  if (text.length > 300) {
    return true;
  }

  // Só emojis (regex para detectar principalmente emojis)
  const emojiOnlyPattern = /^[\p{Emoji}\s]+$/u;
  if (emojiOnlyPattern.test(text.trim())) {
    return true;
  }

  return false;
}

/**
 * Verifica se a mensagem parece ser candidato a lista de compras
 */
function isShoppingCandidate(text: string): boolean {
  const normalized = normalize(text);

  // Múltiplas linhas
  if (normalized.split('\n').length > 1) {
    return true;
  }

  // Tem vírgulas (provavelmente lista)
  if (normalized.includes(',')) {
    return true;
  }

  // Tem conectores como " e ", " e,", ", e"
  if (/\s+e\s+/.test(normalized) || /,\s*e\s+/.test(normalized)) {
    return true;
  }

  // Verbos que indicam compra
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

  if (shoppingVerbs.some((verb) => verb.test(normalized))) {
    return true;
  }

  // Mensagem curta (até 60 chars) que não parece comando nem chat
  if (normalized.length <= 60 && !isCommand(text) && !isChat(text)) {
    return true;
  }

  return false;
}

/**
 * Classifica a intenção de uma mensagem
 */
export function classifyMessage(text: string): MessageIntent {
  // 1. Verifica se deve ignorar
  if (shouldIgnore(text)) {
    return 'IGNORE';
  }

  // 2. Verifica se é comando
  if (isCommand(text)) {
    return 'COMMAND';
  }

  // 3. Verifica se é conversa
  if (isChat(text)) {
    return 'CHAT';
  }

  // 4. Verifica se é candidato a lista de compras
  if (isShoppingCandidate(text)) {
    return 'SHOPPING_CANDIDATE';
  }

  // Padrão: se não se encaixa em nada, é chat
  return 'CHAT';
}

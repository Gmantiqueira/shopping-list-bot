/**
 * Detecta se a mensagem é cadastro/atualização de nome do cliente.
 * Padrões: "meu nome é X", "cadastrar nome X", "sou X".
 * O nome extraído deve ter entre 2 e 100 caracteres (após trim).
 */

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 100;

function isValidName(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length < MIN_NAME_LENGTH || trimmed.length > MAX_NAME_LENGTH) {
    return false;
  }
  if (/^\d+$/.test(trimmed)) {
    return false;
  }
  return true;
}

const PATTERNS: Array<{ regex: RegExp; nameGroup: number }> = [
  { regex: /^meu\s+nome\s+é\s+(.+)$/i, nameGroup: 1 },
  { regex: /^cadastrar\s+nome\s+(.+)$/i, nameGroup: 1 },
  { regex: /^sou\s+(.+)$/i, nameGroup: 1 },
];

/**
 * Retorna o nome extraído se a mensagem for claramente de cadastro; caso contrário null.
 */
export function detectNameRegistration(text: string): string | null {
  const trimmed = text.trim();
  for (const { regex, nameGroup } of PATTERNS) {
    const match = trimmed.match(regex);
    if (match) {
      const name = match[nameGroup].trim();
      if (isValidName(name)) {
        return name;
      }
      return null;
    }
  }
  return null;
}

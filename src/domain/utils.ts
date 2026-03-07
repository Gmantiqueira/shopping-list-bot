/**
 * Normaliza o nome de um item:
 * - trim
 * - lowercase
 * - remove espaços duplicados
 */
export function normalizeItemName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

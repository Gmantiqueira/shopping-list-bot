/**
 * Normaliza o nome de um item:
 * - trim
 * - lowercase
 * - remove espaços duplicados
 */
export function normalizeItemName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Normaliza telefone para busca/gravação: apenas dígitos.
 * Ex.: "55 11 99999-9999" -> "5511999999999"
 * Previsível e seguro para uso como chave única.
 */
export function normalizePhone(phone: string): string {
  return phone.trim().replace(/\D/g, '');
}

/**
 * Dicionário de aliases para normalização de itens
 * Formato: alias -> item canônico
 */
export const SHOPPING_ALIASES: Record<string, string> = {
  // Coca-Cola
  'coca cola': 'coca-cola',
  coca: 'coca-cola',
  'coca cola zero': 'coca-cola zero',
  'coca zero': 'coca-cola zero',
  'coca cola diet': 'coca-cola diet',
  'coca diet': 'coca-cola diet',

  // Papel higiênico
  'papel higienico': 'papel higiênico',
  'papel higiênico': 'papel higiênico',
  'papel hig': 'papel higiênico',

  // Papel toalha
  'papel toalha': 'papel toalha',
  'papel toalhas': 'papel toalha',

  // Produtos de limpeza
  amaciante: 'amaciante',
  detergente: 'detergente',
  'detergente liquido': 'detergente líquido',
  'detergente líquido': 'detergente líquido',

  // Leite
  'leite integral': 'leite integral',
  'leite desnatado': 'leite desnatado',
  'leite semidesnatado': 'leite semidesnatado',

  // Açúcar
  açucar: 'açúcar',
  acucar: 'açúcar',
  'açucar cristal': 'açúcar cristal',
  'acucar cristal': 'açúcar cristal',
};

/**
 * Aplica aliases a um item normalizado
 */
export function applyAlias(item: string): string {
  const normalized = item.toLowerCase().trim();
  return SHOPPING_ALIASES[normalized] || item;
}

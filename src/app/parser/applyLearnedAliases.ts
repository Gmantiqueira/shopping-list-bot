import { createGroupItemAliasRepository } from '../../infra/groupItemAliasFactory.js';

/**
 * Aplica aliases aprendidos por grupo aos itens extraídos
 */
export async function applyLearnedAliases(
  groupId: string,
  items: string[]
): Promise<string[]> {
  const repository = createGroupItemAliasRepository();
  if (!repository) {
    // Se não há repositório (MEMORY mode), retorna itens sem alteração
    return items;
  }

  try {
    // Aplica aliases a cada item
    const aliasedItems = await Promise.all(
      items.map(async (item) => {
        const alias = await repository.findByGroupIdAndRawTerm(groupId, item);
        return alias ? alias.canonicalItem : item;
      })
    );

    return aliasedItems;
  } catch (error) {
    // Se falhar, retorna itens originais sem quebrar o parser
    console.warn('Failed to apply learned aliases:', error);
    return items;
  }
}

import type { ShoppingItem } from '../../domain/types.js';
import { createGroupItemAliasRepository } from '../../infra/groupItemAliasFactory.js';

/**
 * Aplica aliases aprendidos por grupo às strings de itens (compatibilidade).
 * Prefira applyLearnedAliasesToItems após parseItemText para normalizar pelo nome.
 */
export async function applyLearnedAliases(
  groupId: string,
  items: string[]
): Promise<string[]> {
  const repository = createGroupItemAliasRepository();
  if (!repository) {
    return items;
  }

  try {
    const aliasedItems = await Promise.all(
      items.map(async (item) => {
        const alias = await repository.findByGroupIdAndRawTerm(groupId, item);
        return alias ? alias.canonicalItem : item;
      })
    );
    return aliasedItems;
  } catch (error) {
    console.warn('Failed to apply learned aliases:', error);
    return items;
  }
}

/**
 * Normaliza o nome de cada ShoppingItem usando GroupItemAlias (rawTerm -> canonicalItem).
 * Aplicado no pipeline após parseItemText, para que "2 refri" vire name "refrigerante".
 * Se não houver alias para o nome, o item permanece inalterado.
 */
export async function applyLearnedAliasesToItems(
  groupId: string,
  items: ShoppingItem[]
): Promise<ShoppingItem[]> {
  const repository = createGroupItemAliasRepository();
  if (!repository) {
    return items;
  }

  try {
    const result = await Promise.all(
      items.map(async (item) => {
        const name = item.name?.trim() ?? '';
        if (!name) return item;

        let alias = await repository.findByGroupIdAndRawTerm(groupId, name);
        if (!alias && name !== name.toLowerCase()) {
          alias = await repository.findByGroupIdAndRawTerm(
            groupId,
            name.toLowerCase()
          );
        }
        if (alias) {
          return { ...item, name: alias.canonicalItem };
        }
        return item;
      })
    );
    return result;
  } catch (error) {
    console.warn('Failed to apply learned aliases to items:', error);
    return items;
  }
}

import type {
  Item,
  AddItemsResult,
  ListItemRepository,
  ShoppingItem,
} from './types.js';
import { normalizeItemName } from './utils.js';

export class ListService {
  constructor(private readonly repository: ListItemRepository) {}

  async addItems(
    groupId: string,
    userId: string,
    items: ShoppingItem[]
  ): Promise<AddItemsResult> {
    const added: Item[] = [];
    const duplicated: ShoppingItem[] = [];

    for (const shoppingItem of items) {
      const normalizedName = normalizeItemName(shoppingItem.name);
      const quantity = shoppingItem.quantity ?? 1;
      const unit = shoppingItem.unit ?? 'un';

      // Verifica se já existe um item pending com esse nome
      const existingItem = await this.repository.findByGroupIdAndName(
        groupId,
        normalizedName
      );

      if (existingItem && existingItem.status === 'pending') {
        duplicated.push(shoppingItem);
        continue;
      }

      // Cria novo item
      const newItem: Item = {
        id: crypto.randomUUID(),
        groupId,
        name: normalizedName,
        quantity,
        unit,
        status: 'pending',
        createdBy: userId,
        createdAt: new Date(),
      };

      await this.repository.save(newItem);
      added.push(newItem);
    }

    return { added, duplicated };
  }

  async listItems(groupId: string): Promise<Item[]> {
    const items = await this.repository.findByGroupId(groupId);

    // Ordena: pending primeiro, depois bought
    // Dentro de cada grupo, ordena por createdAt
    return items.sort((a, b) => {
      // Primeiro ordena por status (pending vem antes de bought)
      if (a.status !== b.status) {
        if (a.status === 'pending') return -1;
        if (b.status === 'pending') return 1;
      }

      // Depois ordena por createdAt (mais antigo primeiro)
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  async removeItemByName(groupId: string, name: string): Promise<boolean> {
    const normalizedName = normalizeItemName(name);
    const item = await this.repository.findByGroupIdAndName(
      groupId,
      normalizedName
    );

    if (!item) {
      return false;
    }

    await this.repository.delete(item.id);
    return true;
  }

  async markBoughtByName(
    groupId: string,
    name: string,
    userId: string
  ): Promise<boolean> {
    const normalizedName = normalizeItemName(name);
    const item = await this.repository.findByGroupIdAndName(
      groupId,
      normalizedName
    );

    if (!item || item.status === 'bought') {
      return false;
    }

    const updatedItem: Item = {
      ...item,
      status: 'bought',
      boughtBy: userId,
      boughtAt: new Date(),
    };

    await this.repository.save(updatedItem);
    return true;
  }

  async clearList(groupId: string): Promise<void> {
    await this.repository.deleteByGroupId(groupId);
  }
}

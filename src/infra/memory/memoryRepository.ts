import type { Item, ListItemRepository } from '../../domain/types.js';

export class MemoryListItemRepository implements ListItemRepository {
  private items: Map<string, Item> = new Map();

  async getOrCreateListId(groupId: string): Promise<string> {
    return `mem-${groupId}`;
  }

  async finalizeListByGroupId(_groupId: string): Promise<boolean> {
    return true;
  }

  async findByGroupId(groupId: string): Promise<Item[]> {
    return Array.from(this.items.values()).filter(
      (item) => item.groupId === groupId
    );
  }

  async findByGroupIdAndName(
    groupId: string,
    normalizedName: string
  ): Promise<Item | null> {
    const items = await this.findByGroupId(groupId);
    return items.find((item) => item.name === normalizedName) || null;
  }

  async save(item: Item): Promise<Item> {
    this.items.set(item.id, { ...item });
    return { ...item };
  }

  async delete(itemId: string): Promise<void> {
    this.items.delete(itemId);
  }

  async deleteByGroupId(groupId: string): Promise<void> {
    const items = await this.findByGroupId(groupId);
    for (const item of items) {
      this.items.delete(item.id);
    }
  }

  // Método auxiliar para testes
  clear(): void {
    this.items.clear();
  }
}

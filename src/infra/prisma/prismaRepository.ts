import { getPrismaClient } from './prismaClient.js';
import type { Item, ListItemRepository } from '../../domain/types.js';

export class PrismaListItemRepository implements ListItemRepository {
  private prisma = getPrismaClient();

  async findByGroupId(groupId: string): Promise<Item[]> {
    const items = await this.prisma.item.findMany({
      where: { groupId },
      orderBy: [{ createdAt: 'asc' }],
    });

    return items.map(this.mapToDomain);
  }

  async findByGroupIdAndName(
    groupId: string,
    normalizedName: string
  ): Promise<Item | null> {
    const item = await this.prisma.item.findFirst({
      where: {
        groupId,
        name: normalizedName,
      },
    });

    return item ? this.mapToDomain(item) : null;
  }

  async save(item: Item): Promise<Item> {
    const saved = await this.prisma.item.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        status: item.status,
        boughtBy: item.boughtBy ?? null,
        boughtAt: item.boughtAt ?? null,
      },
      create: {
        id: item.id,
        groupId: item.groupId,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        status: item.status,
        createdBy: item.createdBy,
        createdAt: item.createdAt,
        boughtBy: item.boughtBy ?? null,
        boughtAt: item.boughtAt ?? null,
      },
    });

    return this.mapToDomain(saved);
  }

  async delete(itemId: string): Promise<void> {
    await this.prisma.item.delete({
      where: { id: itemId },
    });
  }

  async deleteByGroupId(groupId: string): Promise<void> {
    await this.prisma.item.deleteMany({
      where: { groupId },
    });
  }

  private mapToDomain(item: {
    id: string;
    groupId: string;
    name: string;
    quantity: number;
    unit: string;
    status: string;
    createdBy: string;
    createdAt: Date;
    boughtBy: string | null;
    boughtAt: Date | null;
  }): Item {
    return {
      id: item.id,
      groupId: item.groupId,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      status: item.status as 'pending' | 'bought',
      createdBy: item.createdBy,
      createdAt: item.createdAt,
      boughtBy: item.boughtBy ?? undefined,
      boughtAt: item.boughtAt ?? undefined,
    };
  }
}

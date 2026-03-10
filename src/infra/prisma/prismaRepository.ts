import { getPrismaClient } from './prismaClient.js';
import type { Item, ListItemRepository } from '../../domain/types.js';

export class PrismaListItemRepository implements ListItemRepository {
  private prisma = getPrismaClient();

  async getOrCreateListId(groupId: string): Promise<string> {
    const list = await this.prisma.list.findFirst({
      where: { groupId, status: 'open' },
    });
    if (list) return list.id;
    const customer =
      (await this.prisma.customer.findFirst({
        where: { phone: 'legacy' },
      })) ??
      (await this.prisma.customer.create({
        data: { phone: 'legacy', name: null },
      }));
    const newList = await this.prisma.list.create({
      data: { customerId: customer.id, groupId, status: 'open' },
    });
    return newList.id;
  }

  async finalizeListByGroupId(groupId: string): Promise<boolean> {
    const updated = await this.prisma.list.updateMany({
      where: { groupId, status: 'open' },
      data: { status: 'submitted' },
    });
    return updated.count > 0;
  }

  async findByGroupId(groupId: string): Promise<Item[]> {
    const openList = await this.prisma.list.findFirst({
      where: { groupId, status: 'open' },
      orderBy: { createdAt: 'desc' },
    });
    if (!openList) return [];

    const items = await this.prisma.item.findMany({
      where: { listId: openList.id },
      orderBy: [{ createdAt: 'asc' }],
    });

    return items.map(this.mapToDomain);
  }

  async findByGroupIdAndName(
    groupId: string,
    normalizedName: string
  ): Promise<Item | null> {
    const openList = await this.prisma.list.findFirst({
      where: { groupId, status: 'open' },
      orderBy: { createdAt: 'desc' },
    });
    if (!openList) return null;
    const item = await this.prisma.item.findFirst({
      where: { listId: openList.id, name: normalizedName },
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
        list: { connect: { id: item.listId } },
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
    const openList = await this.prisma.list.findFirst({
      where: { groupId, status: 'open' },
      orderBy: { createdAt: 'desc' },
    });
    if (!openList) return;
    await this.prisma.item.deleteMany({
      where: { listId: openList.id },
    });
  }

  private mapToDomain(item: {
    id: string;
    listId: string;
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
      listId: item.listId,
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

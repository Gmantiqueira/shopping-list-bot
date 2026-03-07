import { getPrismaClient } from './prismaClient.js';
import type {
  GroupItemAlias,
  GroupItemAliasRepository,
  CreateGroupItemAliasInput,
  UpdateGroupItemAliasInput,
  AliasSource,
} from '../../domain/types.js';

export class PrismaGroupItemAliasRepository implements GroupItemAliasRepository {
  private prisma = getPrismaClient();

  async findByGroupIdAndRawTerm(
    groupId: string,
    rawTerm: string
  ): Promise<GroupItemAlias | null> {
    const alias = await this.prisma.groupItemAlias.findUnique({
      where: {
        groupId_rawTerm: {
          groupId,
          rawTerm,
        },
      },
    });

    return alias ? this.mapToDomain(alias) : null;
  }

  async findByGroupId(groupId: string): Promise<GroupItemAlias[]> {
    const aliases = await this.prisma.groupItemAlias.findMany({
      where: { groupId },
      orderBy: [{ lastSeenAt: 'desc' }],
    });

    return aliases.map(this.mapToDomain);
  }

  async save(input: CreateGroupItemAliasInput): Promise<GroupItemAlias> {
    const saved = await this.prisma.groupItemAlias.create({
      data: {
        groupId: input.groupId,
        rawTerm: input.rawTerm,
        canonicalItem: input.canonicalItem,
        source: input.source,
        usageCount: 1,
      },
    });

    return this.mapToDomain(saved);
  }

  async update(
    id: string,
    input: UpdateGroupItemAliasInput
  ): Promise<GroupItemAlias> {
    const updated = await this.prisma.groupItemAlias.update({
      where: { id },
      data: {
        canonicalItem: input.canonicalItem,
        source: input.source,
        usageCount: input.usageCount,
        lastSeenAt: input.lastSeenAt,
      },
    });

    return this.mapToDomain(updated);
  }

  async upsert(input: CreateGroupItemAliasInput): Promise<GroupItemAlias> {
    const upserted = await this.prisma.groupItemAlias.upsert({
      where: {
        groupId_rawTerm: {
          groupId: input.groupId,
          rawTerm: input.rawTerm,
        },
      },
      update: {
        canonicalItem: input.canonicalItem,
        source: input.source,
        usageCount: {
          increment: 1,
        },
        lastSeenAt: new Date(),
      },
      create: {
        groupId: input.groupId,
        rawTerm: input.rawTerm,
        canonicalItem: input.canonicalItem,
        source: input.source,
        usageCount: 1,
      },
    });

    return this.mapToDomain(upserted);
  }

  private mapToDomain(alias: any): GroupItemAlias {
    return {
      id: alias.id,
      groupId: alias.groupId,
      rawTerm: alias.rawTerm,
      canonicalItem: alias.canonicalItem,
      source: alias.source as AliasSource,
      usageCount: alias.usageCount,
      lastSeenAt: alias.lastSeenAt,
      createdAt: alias.createdAt,
      updatedAt: alias.updatedAt,
    };
  }
}

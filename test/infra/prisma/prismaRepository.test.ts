import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { PrismaListItemRepository } from '../../../src/infra/prisma/prismaRepository.js';
import { getPrismaClient } from '../../../src/infra/prisma/prismaClient.js';

describe('PrismaListItemRepository - Integration', () => {
  let repository: PrismaListItemRepository;
  const prisma = getPrismaClient();

  beforeEach(async () => {
    // Limpa o banco antes de cada teste
    await prisma.item.deleteMany();
    repository = new PrismaListItemRepository();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should save and find items by groupId', async () => {
    const item = {
      id: 'test-1',
      groupId: 'group1',
      name: 'leite',
      status: 'pending' as const,
      createdBy: 'user1',
      createdAt: new Date(),
    };

    await repository.save(item);
    const items = await repository.findByGroupId('group1');

    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('leite');
    expect(items[0].groupId).toBe('group1');
  });

  it('should find item by groupId and name', async () => {
    const item = {
      id: 'test-2',
      groupId: 'group1',
      name: 'pão',
      status: 'pending' as const,
      createdBy: 'user1',
      createdAt: new Date(),
    };

    await repository.save(item);
    const found = await repository.findByGroupIdAndName('group1', 'pão');

    expect(found).not.toBeNull();
    expect(found?.name).toBe('pão');
  });

  it('should update item when saving with same id', async () => {
    const item = {
      id: 'test-3',
      groupId: 'group1',
      name: 'leite',
      status: 'pending' as const,
      createdBy: 'user1',
      createdAt: new Date(),
    };

    await repository.save(item);

    const updated = {
      ...item,
      status: 'bought' as const,
      boughtBy: 'user2',
      boughtAt: new Date(),
    };

    await repository.save(updated);
    const found = await repository.findByGroupIdAndName('group1', 'leite');

    expect(found?.status).toBe('bought');
    expect(found?.boughtBy).toBe('user2');
  });

  it('should delete item by id', async () => {
    const item = {
      id: 'test-4',
      groupId: 'group1',
      name: 'manteiga',
      status: 'pending' as const,
      createdBy: 'user1',
      createdAt: new Date(),
    };

    await repository.save(item);
    await repository.delete('test-4');

    const found = await repository.findByGroupIdAndName('group1', 'manteiga');
    expect(found).toBeNull();
  });

  it('should delete all items by groupId', async () => {
    await repository.save({
      id: 'test-5',
      groupId: 'group1',
      name: 'leite',
      status: 'pending' as const,
      createdBy: 'user1',
      createdAt: new Date(),
    });

    await repository.save({
      id: 'test-6',
      groupId: 'group1',
      name: 'pão',
      status: 'pending' as const,
      createdBy: 'user1',
      createdAt: new Date(),
    });

    await repository.save({
      id: 'test-7',
      groupId: 'group2',
      name: 'manteiga',
      status: 'pending' as const,
      createdBy: 'user1',
      createdAt: new Date(),
    });

    await repository.deleteByGroupId('group1');

    const group1Items = await repository.findByGroupId('group1');
    const group2Items = await repository.findByGroupId('group2');

    expect(group1Items).toHaveLength(0);
    expect(group2Items).toHaveLength(1);
    expect(group2Items[0].name).toBe('manteiga');
  });

  it('should isolate items by groupId', async () => {
    await repository.save({
      id: 'test-8',
      groupId: 'group1',
      name: 'leite',
      status: 'pending' as const,
      createdBy: 'user1',
      createdAt: new Date(),
    });

    await repository.save({
      id: 'test-9',
      groupId: 'group2',
      name: 'leite',
      status: 'pending' as const,
      createdBy: 'user1',
      createdAt: new Date(),
    });

    const group1Items = await repository.findByGroupId('group1');
    const group2Items = await repository.findByGroupId('group2');

    expect(group1Items).toHaveLength(1);
    expect(group2Items).toHaveLength(1);
    expect(group1Items[0].groupId).toBe('group1');
    expect(group2Items[0].groupId).toBe('group2');
  });
});

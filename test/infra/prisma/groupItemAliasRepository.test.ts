import { describe, it, expect, beforeEach } from 'vitest';
import { PrismaGroupItemAliasRepository } from '../../../src/infra/prisma/groupItemAliasRepository.js';
import { getPrismaClient } from '../../../src/infra/prisma/prismaClient.js';

describe('PrismaGroupItemAliasRepository', () => {
  let repository: PrismaGroupItemAliasRepository;
  let prisma: ReturnType<typeof getPrismaClient>;

  beforeEach(async () => {
    repository = new PrismaGroupItemAliasRepository();
    prisma = getPrismaClient();

    // Limpa aliases antes de cada teste
    await prisma.groupItemAlias.deleteMany({});
  });

  it('should save a new alias', async () => {
    const alias = await repository.save({
      groupId: 'test-group',
      rawTerm: 'refri',
      canonicalItem: 'coca-cola',
      source: 'manual',
    });

    expect(alias.id).toBeDefined();
    expect(alias.groupId).toBe('test-group');
    expect(alias.rawTerm).toBe('refri');
    expect(alias.canonicalItem).toBe('coca-cola');
    expect(alias.source).toBe('manual');
    expect(alias.usageCount).toBe(1);
    expect(alias.createdAt).toBeInstanceOf(Date);
    expect(alias.lastSeenAt).toBeInstanceOf(Date);
  });

  it('should upsert and increment usageCount when alias exists', async () => {
    // Cria primeiro alias
    const first = await repository.upsert({
      groupId: 'test-group',
      rawTerm: 'refri',
      canonicalItem: 'coca-cola',
      source: 'manual',
    });

    expect(first.usageCount).toBe(1);

    // Upsert novamente
    const second = await repository.upsert({
      groupId: 'test-group',
      rawTerm: 'refri',
      canonicalItem: 'coca-cola',
      source: 'manual',
    });

    expect(second.id).toBe(first.id);
    expect(second.usageCount).toBe(2);
    expect(second.canonicalItem).toBe('coca-cola');
  });

  it('should update canonicalItem on upsert', async () => {
    // Cria primeiro alias
    await repository.upsert({
      groupId: 'test-group',
      rawTerm: 'refri',
      canonicalItem: 'coca-cola',
      source: 'manual',
    });

    // Upsert com canonicalItem diferente
    const updated = await repository.upsert({
      groupId: 'test-group',
      rawTerm: 'refri',
      canonicalItem: 'coca-cola zero',
      source: 'feedback',
    });

    expect(updated.canonicalItem).toBe('coca-cola zero');
    expect(updated.source).toBe('feedback');
    expect(updated.usageCount).toBe(2);
  });

  it('should find alias by groupId and rawTerm', async () => {
    await repository.save({
      groupId: 'test-group',
      rawTerm: 'refri',
      canonicalItem: 'coca-cola',
      source: 'manual',
    });

    const found = await repository.findByGroupIdAndRawTerm(
      'test-group',
      'refri'
    );

    expect(found).not.toBeNull();
    expect(found?.rawTerm).toBe('refri');
    expect(found?.canonicalItem).toBe('coca-cola');
  });

  it('should return null when alias not found', async () => {
    const found = await repository.findByGroupIdAndRawTerm(
      'test-group',
      'refri'
    );

    expect(found).toBeNull();
  });

  it('should list all aliases for a group', async () => {
    await repository.save({
      groupId: 'test-group',
      rawTerm: 'refri',
      canonicalItem: 'coca-cola',
      source: 'manual',
    });

    await repository.save({
      groupId: 'test-group',
      rawTerm: 'papel higienico',
      canonicalItem: 'papel higiênico',
      source: 'manual',
    });

    await repository.save({
      groupId: 'other-group',
      rawTerm: 'refri',
      canonicalItem: 'coca-cola',
      source: 'manual',
    });

    const aliases = await repository.findByGroupId('test-group');

    expect(aliases.length).toBe(2);
    expect(aliases.map((a) => a.rawTerm)).toContain('refri');
    expect(aliases.map((a) => a.rawTerm)).toContain('papel higienico');
  });

  it('should update alias', async () => {
    const saved = await repository.save({
      groupId: 'test-group',
      rawTerm: 'refri',
      canonicalItem: 'coca-cola',
      source: 'manual',
    });

    const updated = await repository.update(saved.id, {
      canonicalItem: 'coca-cola zero',
      source: 'feedback',
      usageCount: 5,
    });

    expect(updated.canonicalItem).toBe('coca-cola zero');
    expect(updated.source).toBe('feedback');
    expect(updated.usageCount).toBe(5);
  });
});

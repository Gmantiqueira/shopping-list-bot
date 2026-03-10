import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  applyLearnedAliases,
  applyLearnedAliasesToItems,
} from '../../../src/app/parser/applyLearnedAliases.js';
import { createGroupItemAliasRepository } from '../../../src/infra/groupItemAliasFactory.js';

// Mock do factory
vi.mock('../../../src/infra/groupItemAliasFactory.js', () => ({
  createGroupItemAliasRepository: vi.fn(),
}));

describe('applyLearnedAliases', () => {
  let mockRepository: any;
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = {
      findByGroupIdAndRawTerm: vi.fn(),
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should apply alias when found', async () => {
    mockRepository.findByGroupIdAndRawTerm.mockResolvedValue({
      id: 'alias-1',
      groupId: 'test-group',
      rawTerm: 'refri',
      canonicalItem: 'coca-cola',
      source: 'manual',
      usageCount: 1,
      createdAt: new Date(),
      lastSeenAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(createGroupItemAliasRepository).mockReturnValue(mockRepository);

    const result = await applyLearnedAliases('test-group', ['refri']);

    expect(result).toEqual(['coca-cola']);
    expect(mockRepository.findByGroupIdAndRawTerm).toHaveBeenCalledWith(
      'test-group',
      'refri'
    );
  });

  it('should keep item when alias not found', async () => {
    mockRepository.findByGroupIdAndRawTerm.mockResolvedValue(null);
    vi.mocked(createGroupItemAliasRepository).mockReturnValue(mockRepository);

    const result = await applyLearnedAliases('test-group', ['leite']);

    expect(result).toEqual(['leite']);
  });

  it('should apply aliases to multiple items', async () => {
    mockRepository.findByGroupIdAndRawTerm
      .mockResolvedValueOnce({
        id: 'alias-1',
        groupId: 'test-group',
        rawTerm: 'refri',
        canonicalItem: 'coca-cola',
        source: 'manual',
        usageCount: 1,
        createdAt: new Date(),
        lastSeenAt: new Date(),
        updatedAt: new Date(),
      })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'alias-2',
        groupId: 'test-group',
        rawTerm: 'papel',
        canonicalItem: 'papel higiênico',
        source: 'manual',
        usageCount: 1,
        createdAt: new Date(),
        lastSeenAt: new Date(),
        updatedAt: new Date(),
      });

    vi.mocked(createGroupItemAliasRepository).mockReturnValue(mockRepository);

    const result = await applyLearnedAliases('test-group', [
      'refri',
      'leite',
      'papel',
    ]);

    expect(result).toEqual(['coca-cola', 'leite', 'papel higiênico']);
  });

  it('should handle duplicate items after alias application', async () => {
    // Simula: "coca" -> "coca-cola" e já existe "coca-cola" na lista
    mockRepository.findByGroupIdAndRawTerm
      .mockResolvedValueOnce({
        id: 'alias-1',
        groupId: 'test-group',
        rawTerm: 'coca',
        canonicalItem: 'coca-cola',
        source: 'manual',
        usageCount: 1,
        createdAt: new Date(),
        lastSeenAt: new Date(),
        updatedAt: new Date(),
      })
      .mockResolvedValueOnce(null);

    vi.mocked(createGroupItemAliasRepository).mockReturnValue(mockRepository);

    const result = await applyLearnedAliases('test-group', [
      'coca',
      'coca-cola',
    ]);

    // A função applyLearnedAliases não deduplica, isso é feito no parseMessage
    // Mas aqui testamos que ambos viram "coca-cola"
    expect(result).toEqual(['coca-cola', 'coca-cola']);
  });

  it('should return items unchanged when repository is null (MEMORY mode)', async () => {
    vi.mocked(createGroupItemAliasRepository).mockReturnValue(null);

    const result = await applyLearnedAliases('test-group', ['refri', 'leite']);

    expect(result).toEqual(['refri', 'leite']);
    expect(mockRepository.findByGroupIdAndRawTerm).not.toHaveBeenCalled();
  });

  it('should return items unchanged when repository lookup fails', async () => {
    mockRepository.findByGroupIdAndRawTerm.mockRejectedValue(
      new Error('Database error')
    );
    vi.mocked(createGroupItemAliasRepository).mockReturnValue(mockRepository);

    const result = await applyLearnedAliases('test-group', ['refri', 'leite']);

    // Deve retornar itens originais sem quebrar
    expect(result).toEqual(['refri', 'leite']);
  });

  it('should handle empty array', async () => {
    vi.mocked(createGroupItemAliasRepository).mockReturnValue(mockRepository);

    const result = await applyLearnedAliases('test-group', []);

    expect(result).toEqual([]);
  });

  it('should apply alias case-sensitively (exact match)', async () => {
    // Alias existe para "refri" (lowercase)
    mockRepository.findByGroupIdAndRawTerm
      .mockResolvedValueOnce({
        id: 'alias-1',
        groupId: 'test-group',
        rawTerm: 'refri',
        canonicalItem: 'coca-cola',
        source: 'manual',
        usageCount: 1,
        createdAt: new Date(),
        lastSeenAt: new Date(),
        updatedAt: new Date(),
      })
      .mockResolvedValueOnce(null); // "REFRI" não encontra alias

    vi.mocked(createGroupItemAliasRepository).mockReturnValue(mockRepository);

    const result = await applyLearnedAliases('test-group', ['refri', 'REFRI']);

    // "refri" vira "coca-cola", "REFRI" permanece
    expect(result).toEqual(['coca-cola', 'REFRI']);
  });
});

describe('applyLearnedAliasesToItems', () => {
  let mockRepository: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = {
      findByGroupIdAndRawTerm: vi.fn(),
    };
  });

  it('should normalize item name by alias (2 refri -> refrigerante)', async () => {
    mockRepository.findByGroupIdAndRawTerm.mockResolvedValue({
      id: 'a1',
      groupId: 'g1',
      rawTerm: 'refri',
      canonicalItem: 'refrigerante',
      source: 'manual',
      usageCount: 1,
      createdAt: new Date(),
      lastSeenAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(createGroupItemAliasRepository).mockReturnValue(mockRepository);

    const result = await applyLearnedAliasesToItems('g1', [
      { name: 'refri', quantity: 2, unit: 'un' },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('refrigerante');
    expect(result[0].quantity).toBe(2);
    expect(mockRepository.findByGroupIdAndRawTerm).toHaveBeenCalledWith(
      'g1',
      'refri'
    );
  });

  it('should normalize 1 coca to canonical name', async () => {
    mockRepository.findByGroupIdAndRawTerm.mockResolvedValue({
      id: 'a1',
      groupId: 'g1',
      rawTerm: 'coca',
      canonicalItem: 'coca cola',
      source: 'manual',
      usageCount: 1,
      createdAt: new Date(),
      lastSeenAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(createGroupItemAliasRepository).mockReturnValue(mockRepository);

    const result = await applyLearnedAliasesToItems('g1', [
      { name: 'coca', quantity: 1, unit: 'un' },
    ]);

    expect(result[0].name).toBe('coca cola');
  });

  it('should keep item when no alias found', async () => {
    mockRepository.findByGroupIdAndRawTerm.mockResolvedValue(null);
    vi.mocked(createGroupItemAliasRepository).mockReturnValue(mockRepository);

    const result = await applyLearnedAliasesToItems('g1', [
      { name: 'arroz', quantity: 1, unit: 'un' },
    ]);

    expect(result[0].name).toBe('arroz');
  });

  it('should return items unchanged when repository is null', async () => {
    vi.mocked(createGroupItemAliasRepository).mockReturnValue(null);

    const items = [{ name: 'refri', quantity: 2, unit: 'un' }];
    const result = await applyLearnedAliasesToItems('g1', items);

    expect(result).toEqual(items);
  });
});

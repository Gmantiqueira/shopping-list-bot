import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AliasLearningService } from '../../../src/app/alias/aliasLearningService.js';
import { createGroupItemAliasRepository } from '../../../src/infra/groupItemAliasFactory.js';

// Mock do factory
vi.mock('../../../src/infra/groupItemAliasFactory.js', () => ({
  createGroupItemAliasRepository: vi.fn(),
}));

describe('AliasLearningService', () => {
  let service: AliasLearningService;
  let mockRepository: any;
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AliasLearningService();
    mockRepository = {
      upsert: vi.fn().mockResolvedValue({
        id: 'alias-123',
        groupId: 'test-group',
        rawTerm: 'refri',
        canonicalItem: 'coca-cola',
        source: 'manual',
        usageCount: 1,
        createdAt: new Date(),
        lastSeenAt: new Date(),
        updatedAt: new Date(),
      }),
      findByGroupIdAndRawTerm: vi.fn().mockResolvedValue(null),
      findByGroupId: vi.fn().mockResolvedValue([]),
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('saveManualAlias', () => {
    it('should save a new alias', async () => {
      vi.mocked(createGroupItemAliasRepository).mockReturnValue(mockRepository);

      await service.saveManualAlias('test-group', 'refri', 'coca-cola');

      expect(mockRepository.upsert).toHaveBeenCalledWith({
        groupId: 'test-group',
        rawTerm: 'refri',
        canonicalItem: 'coca-cola',
        source: 'manual',
      });
    });

    it('should not throw when repository is null (MEMORY mode)', async () => {
      vi.mocked(createGroupItemAliasRepository).mockReturnValue(null);

      await expect(
        service.saveManualAlias('test-group', 'refri', 'coca-cola')
      ).resolves.not.toThrow();
    });
  });

  describe('findAlias', () => {
    it('should find alias by groupId and rawTerm', async () => {
      mockRepository.findByGroupIdAndRawTerm.mockResolvedValue({
        id: 'alias-123',
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

      const result = await service.findAlias('test-group', 'refri');

      expect(result).toEqual({
        rawTerm: 'refri',
        canonicalItem: 'coca-cola',
      });
    });

    it('should return null when alias not found', async () => {
      mockRepository.findByGroupIdAndRawTerm.mockResolvedValue(null);
      vi.mocked(createGroupItemAliasRepository).mockReturnValue(mockRepository);

      const result = await service.findAlias('test-group', 'refri');

      expect(result).toBeNull();
    });

    it('should return null when repository is null (MEMORY mode)', async () => {
      vi.mocked(createGroupItemAliasRepository).mockReturnValue(null);

      const result = await service.findAlias('test-group', 'refri');

      expect(result).toBeNull();
    });
  });

  describe('listAliases', () => {
    it('should list all aliases for a group', async () => {
      mockRepository.findByGroupId.mockResolvedValue([
        {
          id: 'alias-1',
          groupId: 'test-group',
          rawTerm: 'refri',
          canonicalItem: 'coca-cola',
          source: 'manual',
          usageCount: 1,
          createdAt: new Date(),
          lastSeenAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'alias-2',
          groupId: 'test-group',
          rawTerm: 'papel higienico',
          canonicalItem: 'papel higiênico',
          source: 'feedback',
          usageCount: 2,
          createdAt: new Date(),
          lastSeenAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      vi.mocked(createGroupItemAliasRepository).mockReturnValue(mockRepository);

      const result = await service.listAliases('test-group');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        rawTerm: 'refri',
        canonicalItem: 'coca-cola',
        source: 'manual',
      });
      expect(result[1]).toEqual({
        rawTerm: 'papel higienico',
        canonicalItem: 'papel higiênico',
        source: 'feedback',
      });
    });

    it('should return empty array when repository is null (MEMORY mode)', async () => {
      vi.mocked(createGroupItemAliasRepository).mockReturnValue(null);

      const result = await service.listAliases('test-group');

      expect(result).toEqual([]);
    });
  });

  describe('saveFeedbackAlias', () => {
    it('should save alias with feedback source', async () => {
      vi.mocked(createGroupItemAliasRepository).mockReturnValue(mockRepository);

      await service.saveFeedbackAlias('test-group', 'refri', 'coca-cola');

      expect(mockRepository.upsert).toHaveBeenCalledWith({
        groupId: 'test-group',
        rawTerm: 'refri',
        canonicalItem: 'coca-cola',
        source: 'feedback',
      });
    });
  });

  describe('saveAutoPromotedAlias', () => {
    it('should save alias with auto_promoted source', async () => {
      vi.mocked(createGroupItemAliasRepository).mockReturnValue(mockRepository);

      await service.saveAutoPromotedAlias('test-group', 'refri', 'coca-cola');

      expect(mockRepository.upsert).toHaveBeenCalledWith({
        groupId: 'test-group',
        rawTerm: 'refri',
        canonicalItem: 'coca-cola',
        source: 'auto_promoted',
      });
    });
  });
});

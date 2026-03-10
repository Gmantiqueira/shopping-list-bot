import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ItemFeedbackService } from '../../../src/app/feedback/itemFeedbackService.js';
import { createItemFeedbackRepository } from '../../../src/infra/itemFeedbackFactory.js';

// Mock do factory
vi.mock('../../../src/infra/itemFeedbackFactory.js', () => ({
  createItemFeedbackRepository: vi.fn(),
}));

describe('ItemFeedbackService', () => {
  let service: ItemFeedbackService;
  let mockRepository: any;
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ItemFeedbackService();
    mockRepository = {
      save: vi.fn().mockResolvedValue({
        id: 'feedback-123',
        groupId: 'test-group',
        userId: 'test-user',
        rawText: 'test',
        wrongItemsJson: null,
        correctItemsJson: null,
        feedbackType: 'replace',
        createdAt: new Date(),
      }),
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('recordReplace', () => {
    it('should save replace feedback', async () => {
      vi.mocked(createItemFeedbackRepository).mockReturnValue(mockRepository);

      await service.recordReplace(
        'test-group',
        'test-user',
        'leite maçã coca-cola',
        ['leite maçã coca-cola'],
        ['leite', 'maçã', 'coca-cola']
      );

      expect(mockRepository.save).toHaveBeenCalledWith({
        groupId: 'test-group',
        userId: 'test-user',
        rawText: 'leite maçã coca-cola',
        wrongItems: ['leite maçã coca-cola'],
        correctItems: ['leite', 'maçã', 'coca-cola'],
        feedbackType: 'replace',
      });
    });

    it('should include parseEventId when provided', async () => {
      vi.mocked(createItemFeedbackRepository).mockReturnValue(mockRepository);

      await service.recordReplace(
        'test-group',
        'test-user',
        'leite',
        ['leite'],
        ['leite integral'],
        'event-123'
      );

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          parseEventId: 'event-123',
        })
      );
    });
  });

  describe('recordRemoveFalsePositive', () => {
    it('should save remove_false_positive feedback', async () => {
      vi.mocked(createItemFeedbackRepository).mockReturnValue(mockRepository);

      await service.recordRemoveFalsePositive(
        'test-group',
        'test-user',
        'vou no mercado',
        ['vou no mercado']
      );

      expect(mockRepository.save).toHaveBeenCalledWith({
        groupId: 'test-group',
        userId: 'test-user',
        rawText: 'vou no mercado',
        wrongItems: ['vou no mercado'],
        feedbackType: 'remove_false_positive',
      });
    });
  });

  describe('recordAddMissingItem', () => {
    it('should save add_missing_item feedback', async () => {
      vi.mocked(createItemFeedbackRepository).mockReturnValue(mockRepository);

      await service.recordAddMissingItem('test-group', 'test-user', 'leite', [
        'leite',
        'pão',
      ]);

      expect(mockRepository.save).toHaveBeenCalledWith({
        groupId: 'test-group',
        userId: 'test-user',
        rawText: 'leite',
        correctItems: ['leite', 'pão'],
        feedbackType: 'add_missing_item',
      });
    });
  });

  describe('recordAliasManual', () => {
    it('should save alias_manual feedback', async () => {
      vi.mocked(createItemFeedbackRepository).mockReturnValue(mockRepository);

      await service.recordAliasManual(
        'test-group',
        'test-user',
        'coca',
        ['coca'],
        ['coca-cola']
      );

      expect(mockRepository.save).toHaveBeenCalledWith({
        groupId: 'test-group',
        userId: 'test-user',
        rawText: 'coca',
        wrongItems: ['coca'],
        correctItems: ['coca-cola'],
        feedbackType: 'alias_manual',
      });
    });
  });

  describe('error handling', () => {
    it('should not throw when repository is null (MEMORY mode)', async () => {
      vi.mocked(createItemFeedbackRepository).mockReturnValue(null);

      await expect(
        service.recordReplace(
          'test-group',
          'test-user',
          'leite',
          ['leite'],
          ['leite integral']
        )
      ).resolves.not.toThrow();
    });

    it('should not throw when save fails', async () => {
      const errorRepository = {
        save: vi.fn().mockRejectedValue(new Error('Database error')),
      };
      vi.mocked(createItemFeedbackRepository).mockReturnValue(errorRepository);

      await expect(
        service.recordReplace(
          'test-group',
          'test-user',
          'leite',
          ['leite'],
          ['leite integral']
        )
      ).resolves.not.toThrow();
    });
  });

  describe('array serialization', () => {
    it('should serialize arrays correctly', async () => {
      vi.mocked(createItemFeedbackRepository).mockReturnValue(mockRepository);

      await service.recordReplace(
        'test-group',
        'test-user',
        'test',
        ['item1', 'item2', 'item3'],
        ['correct1', 'correct2']
      );

      const call = mockRepository.save.mock.calls[0][0];
      expect(Array.isArray(call.wrongItems)).toBe(true);
      expect(Array.isArray(call.correctItems)).toBe(true);
      expect(call.wrongItems).toEqual(['item1', 'item2', 'item3']);
      expect(call.correctItems).toEqual(['correct1', 'correct2']);
    });
  });

  describe('recordConfirmationFeedback', () => {
    it('should record positive feedback when accepted', async () => {
      vi.mocked(createItemFeedbackRepository).mockReturnValue(mockRepository);

      await service.recordConfirmationFeedback(
        'g1',
        'user1',
        'arroz',
        true,
        ['arroz']
      );

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          groupId: 'g1',
          userId: 'user1',
          rawText: 'arroz',
          feedbackType: 'confirmation_accepted',
          correctItems: ['arroz'],
          wrongItems: undefined,
        })
      );
    });

    it('should record negative feedback when rejected', async () => {
      vi.mocked(createItemFeedbackRepository).mockReturnValue(mockRepository);

      await service.recordConfirmationFeedback(
        'g1',
        'user1',
        'oi',
        false,
        ['oi']
      );

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          groupId: 'g1',
          userId: 'user1',
          rawText: 'oi',
          feedbackType: 'confirmation_rejected',
          wrongItems: ['oi'],
          correctItems: undefined,
        })
      );
    });
  });
});

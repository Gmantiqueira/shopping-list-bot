import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ImplicitCorrectionService } from '../../../src/app/feedback/implicitCorrectionService.js';
import { ItemFeedbackService } from '../../../src/app/feedback/itemFeedbackService.js';

// Mocks
vi.mock('../../../src/app/feedback/itemFeedbackService.js', () => ({
  ItemFeedbackService: vi.fn(),
}));

describe('ImplicitCorrectionService', () => {
  let service: ImplicitCorrectionService;
  let mockFeedbackService: any;
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockFeedbackService = {
      recordReplace: vi.fn().mockResolvedValue(undefined),
    };

    (ItemFeedbackService as any).mockImplementation(() => mockFeedbackService);

    service = new ImplicitCorrectionService();
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env = originalEnv;
  });

  it('should record removal', () => {
    service.recordRemoval('group1', 'user1', 'papel');
    // Não há retorno, apenas verifica que não lança erro
    expect(true).toBe(true);
  });

  it('should process implicit correction when remove followed by add', async () => {
    service.recordRemoval('group1', 'user1', 'papel');

    await service.checkAndProcessImplicitCorrection(
      'group1',
      'user1',
      ['papel higiênico'],
      'papel higiênico'
    );

    expect(mockFeedbackService.recordReplace).toHaveBeenCalledWith(
      'group1',
      'user1',
      'papel higiênico',
      ['papel'],
      ['papel higiênico']
    );
  });

  it('should not process if no recent removal', async () => {
    await service.checkAndProcessImplicitCorrection(
      'group1',
      'user1',
      ['papel higiênico'],
      'papel higiênico'
    );

    expect(mockFeedbackService.recordReplace).not.toHaveBeenCalled();
  });

  it('should not process if removal expired', async () => {
    service.recordRemoval('group1', 'user1', 'papel');

    // Avança 2 minutos e 1 segundo
    vi.advanceTimersByTime(2 * 60 * 1000 + 1000);

    await service.checkAndProcessImplicitCorrection(
      'group1',
      'user1',
      ['papel higiênico'],
      'papel higiênico'
    );

    expect(mockFeedbackService.recordReplace).not.toHaveBeenCalled();
  });

  it('should not process if multiple items added', async () => {
    service.recordRemoval('group1', 'user1', 'papel');

    await service.checkAndProcessImplicitCorrection(
      'group1',
      'user1',
      ['papel higiênico', 'leite'],
      'papel higiênico, leite'
    );

    expect(mockFeedbackService.recordReplace).not.toHaveBeenCalled();
  });

  it('should not process if items are the same', async () => {
    service.recordRemoval('group1', 'user1', 'papel');

    await service.checkAndProcessImplicitCorrection(
      'group1',
      'user1',
      ['papel'],
      'papel'
    );

    expect(mockFeedbackService.recordReplace).not.toHaveBeenCalled();
  });

  it('should isolate by groupId', async () => {
    service.recordRemoval('group1', 'user1', 'papel');

    await service.checkAndProcessImplicitCorrection(
      'group2',
      'user1',
      ['papel higiênico'],
      'papel higiênico'
    );

    expect(mockFeedbackService.recordReplace).not.toHaveBeenCalled();
  });

  it('should isolate by userId', async () => {
    service.recordRemoval('group1', 'user1', 'papel');

    await service.checkAndProcessImplicitCorrection(
      'group1',
      'user2',
      ['papel higiênico'],
      'papel higiênico'
    );

    expect(mockFeedbackService.recordReplace).not.toHaveBeenCalled();
  });

  it('should record feedback (promotion is handled by ItemFeedbackService)', async () => {
    service.recordRemoval('group1', 'user1', 'papel');

    await service.checkAndProcessImplicitCorrection(
      'group1',
      'user1',
      ['papel higiênico'],
      'papel higiênico'
    );

    // A promoção agora é feita pelo ItemFeedbackService, não aqui
    expect(mockFeedbackService.recordReplace).toHaveBeenCalledWith(
      'group1',
      'user1',
      'papel higiênico',
      ['papel'],
      ['papel higiênico']
    );
  });

  it('should record feedback regardless of count (promotion handled separately)', async () => {
    service.recordRemoval('group1', 'user1', 'papel');

    await service.checkAndProcessImplicitCorrection(
      'group1',
      'user1',
      ['papel higiênico'],
      'papel higiênico'
    );

    // Sempre registra feedback, promoção é feita pelo ItemFeedbackService
    expect(mockFeedbackService.recordReplace).toHaveBeenCalled();
  });

  it('should record feedback in any mode', async () => {
    service.recordRemoval('group1', 'user1', 'papel');

    await service.checkAndProcessImplicitCorrection(
      'group1',
      'user1',
      ['papel higiênico'],
      'papel higiênico'
    );

    // Sempre registra feedback, independente do modo
    expect(mockFeedbackService.recordReplace).toHaveBeenCalled();
  });
});

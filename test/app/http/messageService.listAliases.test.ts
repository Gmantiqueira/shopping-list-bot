import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HttpMessageService } from '../../../src/app/http/messageService.js';
import { ListService } from '../../../src/domain/listService.js';
import { createRepository } from '../../../src/infra/repositoryFactory.js';
import { AliasLearningService } from '../../../src/app/alias/aliasLearningService.js';

// Mock do AliasLearningService
vi.mock('../../../src/app/alias/aliasLearningService.js', () => ({
  AliasLearningService: vi.fn(),
}));

describe('HttpMessageService - COMMAND_LIST_ALIASES', () => {
  let messageService: HttpMessageService;
  let mockAliasService: any;

  beforeEach(() => {
    const repository = createRepository('MEMORY');
    const listService = new ListService(repository);

    mockAliasService = {
      listAliases: vi.fn(),
    };

    // Mock do construtor
    (AliasLearningService as any).mockImplementation(() => mockAliasService);

    messageService = new HttpMessageService(listService);
  });

  it('should return aliases list when aliases exist', async () => {
    mockAliasService.listAliases.mockResolvedValue([
      { rawTerm: 'refri', canonicalItem: 'coca-cola', source: 'manual' },
      { rawTerm: 'papel', canonicalItem: 'papel higiênico', source: 'manual' },
    ]);

    const result = await messageService.handleMessage({
      text: 'aliases',
      groupId: 'test-group',
      userId: 'test-user',
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Vocabulário aprendido:');
    expect(result.message).toContain('refri → coca-cola');
    expect(result.message).toContain('papel → papel higiênico');
  });

  it('should return empty message when no aliases', async () => {
    mockAliasService.listAliases.mockResolvedValue([]);

    const result = await messageService.handleMessage({
      text: 'aliases',
      groupId: 'test-group',
      userId: 'test-user',
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe(
      'Ainda não aprendi nenhum apelido neste grupo.'
    );
  });

  it('should handle all command variants', async () => {
    mockAliasService.listAliases.mockResolvedValue([
      { rawTerm: 'refri', canonicalItem: 'coca-cola', source: 'manual' },
    ]);

    const commands = ['aliases', 'vocabulário', 'vocabulario'];

    for (const cmd of commands) {
      const result = await messageService.handleMessage({
        text: cmd,
        groupId: 'test-group',
        userId: 'test-user',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Vocabulário aprendido:');
    }
  });
});

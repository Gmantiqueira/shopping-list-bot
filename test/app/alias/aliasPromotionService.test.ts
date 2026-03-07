import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AliasPromotionService } from '../../../src/app/alias/aliasPromotionService.js';
import { AliasLearningService } from '../../../src/app/alias/aliasLearningService.js';
import { getPrismaClient } from '../../../src/infra/prisma/prismaClient.js';

// Mocks
vi.mock('../../../src/app/alias/aliasLearningService.js', () => ({
  AliasLearningService: vi.fn(),
}));

vi.mock('../../../src/infra/prisma/prismaClient.js', () => ({
  getPrismaClient: vi.fn(),
}));

describe('AliasPromotionService', () => {
  let service: AliasPromotionService;
  let mockAliasService: any;
  let mockPrisma: any;
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAliasService = {
      findAlias: vi.fn().mockResolvedValue(null),
      saveAutoPromotedAlias: vi.fn().mockResolvedValue(undefined),
    };

    mockPrisma = {
      itemFeedback: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    (AliasLearningService as any).mockImplementation(() => mockAliasService);
    (getPrismaClient as any).mockReturnValue(mockPrisma);

    process.env.REPOSITORY_TYPE = 'PRISMA';
    service = new AliasPromotionService();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should promote alias after 3 feedbacks with same pattern', async () => {
    // Mock 3 feedbacks com o mesmo padrão
    mockPrisma.itemFeedback.findMany.mockResolvedValue([
      {
        wrongItemsJson: JSON.stringify(['papel']),
        correctItemsJson: JSON.stringify(['papel higiênico']),
      },
      {
        wrongItemsJson: JSON.stringify(['papel']),
        correctItemsJson: JSON.stringify(['papel higiênico']),
      },
      {
        wrongItemsJson: JSON.stringify(['papel']),
        correctItemsJson: JSON.stringify(['papel higiênico']),
      },
    ]);

    await service.checkAndPromote('group1', ['papel'], ['papel higiênico']);

    expect(mockAliasService.saveAutoPromotedAlias).toHaveBeenCalledWith(
      'group1',
      'papel',
      'papel higiênico'
    );
  });

  it('should not promote if only 2 feedbacks', async () => {
    // Mock apenas 2 feedbacks
    mockPrisma.itemFeedback.findMany.mockResolvedValue([
      {
        wrongItemsJson: JSON.stringify(['papel']),
        correctItemsJson: JSON.stringify(['papel higiênico']),
      },
      {
        wrongItemsJson: JSON.stringify(['papel']),
        correctItemsJson: JSON.stringify(['papel higiênico']),
      },
    ]);

    await service.checkAndPromote('group1', ['papel'], ['papel higiênico']);

    expect(mockAliasService.saveAutoPromotedAlias).not.toHaveBeenCalled();
  });

  it('should not promote if alias manual exists with different canonical', async () => {
    // Mock alias manual existente
    mockAliasService.findAlias.mockResolvedValue({
      rawTerm: 'papel',
      canonicalItem: 'papel toalha', // Diferente do que está sendo promovido
    });

    mockPrisma.itemFeedback.findMany.mockResolvedValue([
      {
        wrongItemsJson: JSON.stringify(['papel']),
        correctItemsJson: JSON.stringify(['papel higiênico']),
      },
      {
        wrongItemsJson: JSON.stringify(['papel']),
        correctItemsJson: JSON.stringify(['papel higiênico']),
      },
      {
        wrongItemsJson: JSON.stringify(['papel']),
        correctItemsJson: JSON.stringify(['papel higiênico']),
      },
    ]);

    await service.checkAndPromote('group1', ['papel'], ['papel higiênico']);

    // Não deve sobrescrever alias manual
    expect(mockAliasService.saveAutoPromotedAlias).not.toHaveBeenCalled();
  });

  it('should promote if alias manual exists with same canonical', async () => {
    // Mock alias manual existente com mesmo canonical
    mockAliasService.findAlias.mockResolvedValue({
      rawTerm: 'papel',
      canonicalItem: 'papel higiênico', // Mesmo que está sendo promovido
    });

    mockPrisma.itemFeedback.findMany.mockResolvedValue([
      {
        wrongItemsJson: JSON.stringify(['papel']),
        correctItemsJson: JSON.stringify(['papel higiênico']),
      },
      {
        wrongItemsJson: JSON.stringify(['papel']),
        correctItemsJson: JSON.stringify(['papel higiênico']),
      },
      {
        wrongItemsJson: JSON.stringify(['papel']),
        correctItemsJson: JSON.stringify(['papel higiênico']),
      },
    ]);

    await service.checkAndPromote('group1', ['papel'], ['papel higiênico']);

    // Pode atualizar se for o mesmo canonical
    expect(mockAliasService.saveAutoPromotedAlias).toHaveBeenCalled();
  });

  it('should not promote if items are the same', async () => {
    await service.checkAndPromote('group1', ['papel'], ['papel']);

    expect(mockPrisma.itemFeedback.findMany).not.toHaveBeenCalled();
    expect(mockAliasService.saveAutoPromotedAlias).not.toHaveBeenCalled();
  });

  it('should not promote if multiple wrong or correct items', async () => {
    await service.checkAndPromote(
      'group1',
      ['papel', 'leite'],
      ['papel higiênico']
    );

    expect(mockPrisma.itemFeedback.findMany).not.toHaveBeenCalled();
    expect(mockAliasService.saveAutoPromotedAlias).not.toHaveBeenCalled();
  });

  it('should not promote in MEMORY mode', async () => {
    process.env.REPOSITORY_TYPE = 'MEMORY';
    const memService = new AliasPromotionService();

    await memService.checkAndPromote('group1', ['papel'], ['papel higiênico']);

    expect(mockPrisma.itemFeedback.findMany).not.toHaveBeenCalled();
  });

  it('should count feedbacks from both replace and alias_manual types', async () => {
    // Mock feedbacks mistos
    mockPrisma.itemFeedback.findMany.mockResolvedValue([
      {
        wrongItemsJson: JSON.stringify(['papel']),
        correctItemsJson: JSON.stringify(['papel higiênico']),
      },
      {
        wrongItemsJson: JSON.stringify(['papel']),
        correctItemsJson: JSON.stringify(['papel higiênico']),
      },
      {
        wrongItemsJson: JSON.stringify(['papel']),
        correctItemsJson: JSON.stringify(['papel higiênico']),
      },
    ]);

    await service.checkAndPromote('group1', ['papel'], ['papel higiênico']);

    // Deve buscar ambos os tipos
    expect(mockPrisma.itemFeedback.findMany).toHaveBeenCalledWith({
      where: {
        groupId: 'group1',
        feedbackType: {
          in: ['replace', 'alias_manual'],
        },
      },
    });

    expect(mockAliasService.saveAutoPromotedAlias).toHaveBeenCalled();
  });

  it('should normalize items before comparison', async () => {
    // Mock feedbacks com variações de case e espaços
    mockPrisma.itemFeedback.findMany.mockResolvedValue([
      {
        wrongItemsJson: JSON.stringify(['Papel']),
        correctItemsJson: JSON.stringify(['Papel Higiênico']),
      },
      {
        wrongItemsJson: JSON.stringify(['papel ']),
        correctItemsJson: JSON.stringify([' papel higiênico']),
      },
      {
        wrongItemsJson: JSON.stringify(['PAPEL']),
        correctItemsJson: JSON.stringify(['PAPEL HIGIÊNICO']),
      },
    ]);

    await service.checkAndPromote('group1', ['papel'], ['papel higiênico']);

    // Deve contar todos como o mesmo padrão
    expect(mockAliasService.saveAutoPromotedAlias).toHaveBeenCalledWith(
      'group1',
      'papel',
      'papel higiênico'
    );
  });
});

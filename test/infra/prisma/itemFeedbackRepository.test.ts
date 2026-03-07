import { describe, it, expect, beforeEach } from 'vitest';
import { PrismaItemFeedbackRepository } from '../../../src/infra/prisma/itemFeedbackRepository.js';
import { getPrismaClient } from '../../../src/infra/prisma/prismaClient.js';

describe('PrismaItemFeedbackRepository', () => {
  let repository: PrismaItemFeedbackRepository;
  let prisma: ReturnType<typeof getPrismaClient>;

  beforeEach(async () => {
    repository = new PrismaItemFeedbackRepository();
    prisma = getPrismaClient();

    // Limpa feedback antes de cada teste
    await prisma.itemFeedback.deleteMany({});
  });

  it('should save replace feedback', async () => {
    const feedback = await repository.save({
      groupId: 'test-group',
      userId: 'test-user',
      rawText: 'leite maçã coca-cola',
      wrongItems: ['leite maçã coca-cola'],
      correctItems: ['leite', 'maçã', 'coca-cola'],
      feedbackType: 'replace',
    });

    expect(feedback.id).toBeDefined();
    expect(feedback.groupId).toBe('test-group');
    expect(feedback.userId).toBe('test-user');
    expect(feedback.rawText).toBe('leite maçã coca-cola');
    expect(feedback.wrongItemsJson).toBe(
      JSON.stringify(['leite maçã coca-cola'])
    );
    expect(feedback.correctItemsJson).toBe(
      JSON.stringify(['leite', 'maçã', 'coca-cola'])
    );
    expect(feedback.feedbackType).toBe('replace');
    expect(feedback.createdAt).toBeInstanceOf(Date);
  });

  it('should save remove_false_positive feedback', async () => {
    const feedback = await repository.save({
      groupId: 'test-group',
      userId: 'test-user',
      rawText: 'vou no mercado',
      wrongItems: ['vou no mercado'],
      feedbackType: 'remove_false_positive',
    });

    expect(feedback.feedbackType).toBe('remove_false_positive');
    expect(feedback.wrongItemsJson).toBe(JSON.stringify(['vou no mercado']));
    expect(feedback.correctItemsJson).toBeNull();
  });

  it('should save add_missing_item feedback', async () => {
    const feedback = await repository.save({
      groupId: 'test-group',
      userId: 'test-user',
      rawText: 'leite',
      correctItems: ['leite', 'pão'],
      feedbackType: 'add_missing_item',
    });

    expect(feedback.feedbackType).toBe('add_missing_item');
    expect(feedback.wrongItemsJson).toBeNull();
    expect(feedback.correctItemsJson).toBe(JSON.stringify(['leite', 'pão']));
  });

  it('should save alias_manual feedback', async () => {
    const feedback = await repository.save({
      groupId: 'test-group',
      userId: 'test-user',
      rawText: 'coca',
      wrongItems: ['coca'],
      correctItems: ['coca-cola'],
      feedbackType: 'alias_manual',
    });

    expect(feedback.feedbackType).toBe('alias_manual');
    expect(feedback.wrongItemsJson).toBe(JSON.stringify(['coca']));
    expect(feedback.correctItemsJson).toBe(JSON.stringify(['coca-cola']));
  });

  it('should save feedback with parseEventId', async () => {
    const feedback = await repository.save({
      parseEventId: 'event-123',
      groupId: 'test-group',
      userId: 'test-user',
      rawText: 'leite',
      wrongItems: ['leite'],
      correctItems: ['leite integral'],
      feedbackType: 'replace',
    });

    expect(feedback.parseEventId).toBe('event-123');
  });

  it('should handle empty arrays as null', async () => {
    const feedback = await repository.save({
      groupId: 'test-group',
      userId: 'test-user',
      rawText: 'test',
      wrongItems: [],
      correctItems: [],
      feedbackType: 'replace',
    });

    expect(feedback.wrongItemsJson).toBeNull();
    expect(feedback.correctItemsJson).toBeNull();
  });

  it('should persist feedback to database', async () => {
    const feedback = await repository.save({
      groupId: 'test-group',
      userId: 'test-user',
      rawText: 'leite',
      wrongItems: ['leite'],
      correctItems: ['leite integral'],
      feedbackType: 'replace',
    });

    const saved = await prisma.itemFeedback.findUnique({
      where: { id: feedback.id },
    });

    expect(saved).not.toBeNull();
    expect(saved?.groupId).toBe('test-group');
    expect(saved?.rawText).toBe('leite');
    expect(saved?.feedbackType).toBe('replace');
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { PrismaMessageParseEventRepository } from '../../../src/infra/prisma/messageParseEventRepository.js';
import { getPrismaClient } from '../../../src/infra/prisma/prismaClient.js';

describe('PrismaMessageParseEventRepository', () => {
  let repository: PrismaMessageParseEventRepository;
  let prisma: ReturnType<typeof getPrismaClient>;

  beforeEach(async () => {
    repository = new PrismaMessageParseEventRepository();
    prisma = getPrismaClient();

    // Limpa eventos antes de cada teste
    await prisma.messageParseEvent.deleteMany({});
  });

  it('should save a parse event with rule items only', async () => {
    const event = await repository.save({
      groupId: 'test-group',
      userId: 'test-user',
      rawText: 'leite, arroz, feijão',
      ruleItems: ['leite', 'arroz', 'feijão'],
      finalItems: ['leite', 'arroz', 'feijão'],
      usedLlm: false,
      status: 'accepted',
    });

    expect(event.id).toBeDefined();
    expect(event.groupId).toBe('test-group');
    expect(event.userId).toBe('test-user');
    expect(event.rawText).toBe('leite, arroz, feijão');
    expect(event.ruleItemsJson).toBe(
      JSON.stringify(['leite', 'arroz', 'feijão'])
    );
    expect(event.llmItemsJson).toBeNull();
    expect(event.finalItemsJson).toBe(
      JSON.stringify(['leite', 'arroz', 'feijão'])
    );
    expect(event.usedLlm).toBe(false);
    expect(event.status).toBe('accepted');
    expect(event.createdAt).toBeInstanceOf(Date);
  });

  it('should save a parse event with LLM items', async () => {
    const event = await repository.save({
      groupId: 'test-group',
      userId: 'test-user',
      rawText: 'leite maçã coca-cola',
      ruleItems: ['leite maçã coca-cola'],
      llmItems: ['leite', 'maçã', 'coca-cola'],
      finalItems: ['leite', 'maçã', 'coca-cola'],
      usedLlm: true,
      status: 'accepted',
    });

    expect(event.usedLlm).toBe(true);
    expect(event.llmItemsJson).toBe(
      JSON.stringify(['leite', 'maçã', 'coca-cola'])
    );
    expect(event.ruleItemsJson).toBe(JSON.stringify(['leite maçã coca-cola']));
  });

  it('should save a parse event with ignored status', async () => {
    const event = await repository.save({
      groupId: 'test-group',
      userId: 'test-user',
      rawText: 'vou no mercado agora',
      ruleItems: [],
      finalItems: [],
      usedLlm: false,
      status: 'ignored',
    });

    expect(event.status).toBe('ignored');
    expect(event.ruleItemsJson).toBeNull();
    expect(event.finalItemsJson).toBeNull();
  });

  it('should save a parse event with confidence', async () => {
    const event = await repository.save({
      groupId: 'test-group',
      userId: 'test-user',
      rawText: 'leite',
      ruleItems: ['leite'],
      finalItems: ['leite'],
      usedLlm: false,
      confidence: 0.95,
      status: 'accepted',
    });

    expect(event.confidence).toBe(0.95);
  });

  it('should handle empty arrays as null', async () => {
    const event = await repository.save({
      groupId: 'test-group',
      userId: 'test-user',
      rawText: 'test',
      ruleItems: [],
      finalItems: [],
      usedLlm: false,
      status: 'ignored',
    });

    expect(event.ruleItemsJson).toBeNull();
    expect(event.finalItemsJson).toBeNull();
  });

  it('should persist event to database', async () => {
    const event = await repository.save({
      groupId: 'test-group',
      userId: 'test-user',
      rawText: 'leite',
      ruleItems: ['leite'],
      finalItems: ['leite'],
      usedLlm: false,
      status: 'accepted',
    });

    const saved = await prisma.messageParseEvent.findUnique({
      where: { id: event.id },
    });

    expect(saved).not.toBeNull();
    expect(saved?.groupId).toBe('test-group');
    expect(saved?.rawText).toBe('leite');
  });
});

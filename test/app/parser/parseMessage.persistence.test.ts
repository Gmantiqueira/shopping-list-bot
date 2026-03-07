import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { parseMessage } from '../../../src/app/parser/parseMessage.js';
import type { ParseInput } from '../../../src/app/parser/types.js';
import { getPrismaClient } from '../../../src/infra/prisma/prismaClient.js';
import { extractItemsByLLM } from '../../../src/app/parser/extractItemsByLLM.js';

// Mock do extractItemsByLLM
vi.mock('../../../src/app/parser/extractItemsByLLM.js', () => ({
  extractItemsByLLM: vi.fn(),
}));

describe('parseMessage - persistence integration', () => {
  const originalEnv = process.env;
  const originalRepoType = process.env.REPOSITORY_TYPE;
  let prisma: ReturnType<typeof getPrismaClient>;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.REPOSITORY_TYPE = 'PRISMA';
    prisma = getPrismaClient();

    // Limpa eventos antes de cada teste
    await prisma.messageParseEvent.deleteMany({});
  });

  afterEach(async () => {
    process.env = originalEnv;
    if (originalRepoType) {
      process.env.REPOSITORY_TYPE = originalRepoType;
    } else {
      delete process.env.REPOSITORY_TYPE;
    }
  });

  const createInput = (text: string): ParseInput => ({
    text,
    groupId: 'test-group',
    userId: 'test-user',
  });

  it('should save parse event when items are accepted', async () => {
    const inputText = 'leite, arroz, feijão';
    const result = await parseMessage(createInput(inputText));

    expect(result.type).toBe('ITEMS');

    // Aguarda até que o evento seja salvo (com timeout)
    let events = [];
    for (let i = 0; i < 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      events = await prisma.messageParseEvent.findMany({
        where: {
          groupId: 'test-group',
          userId: 'test-user',
          rawText: inputText,
        },
        orderBy: { createdAt: 'desc' },
      });
      if (events.length > 0) break;
    }

    expect(events.length).toBeGreaterThan(0);
    const event = events[0];
    expect(event.rawText).toBe(inputText);
    expect(event.status).toBe('accepted');
    expect(event.finalItemsJson).not.toBeNull();
    const finalItems = JSON.parse(event.finalItemsJson!);
    expect(finalItems).toContain('leite');
    expect(finalItems).toContain('arroz');
    expect(finalItems).toContain('feijão');
  });

  it('should save parse event when message is ignored', async () => {
    const inputText = 'vou no mercado agora';
    const result = await parseMessage(createInput(inputText));

    expect(result.type).toBe('IGNORE');

    // Aguarda até que o evento seja salvo
    let events = [];
    for (let i = 0; i < 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      events = await prisma.messageParseEvent.findMany({
        where: {
          groupId: 'test-group',
          userId: 'test-user',
          rawText: inputText,
        },
        orderBy: { createdAt: 'desc' },
      });
      if (events.length > 0) break;
    }

    expect(events.length).toBeGreaterThan(0);
    const event = events[0];
    expect(event.rawText).toBe(inputText);
    expect(event.status).toBe('ignored');
  });

  it('should save parse event with LLM items when LLM is used', async () => {
    process.env.ENABLE_LLM_ITEM_EXTRACTION = 'true';
    vi.mocked(extractItemsByLLM).mockResolvedValue([
      'leite',
      'maçã',
      'coca-cola',
    ]);

    const inputText = 'leite maçã coca-cola';
    const result = await parseMessage(createInput(inputText));

    expect(result.type).toBe('ITEMS');

    // Aguarda até que o evento seja salvo
    let events = [];
    for (let i = 0; i < 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      events = await prisma.messageParseEvent.findMany({
        where: {
          groupId: 'test-group',
          userId: 'test-user',
          rawText: inputText,
        },
        orderBy: { createdAt: 'desc' },
      });
      if (events.length > 0) break;
    }

    expect(events.length).toBeGreaterThan(0);
    const event = events[0];
    expect(event.usedLlm).toBe(true);
    expect(event.llmItemsJson).not.toBeNull();
    const llmItems = JSON.parse(event.llmItemsJson!);
    expect(llmItems).toEqual(['leite', 'maçã', 'coca-cola']);
  });

  it('should not save events when using MEMORY repository', async () => {
    process.env.REPOSITORY_TYPE = 'MEMORY';

    const result = await parseMessage(createInput('leite'));

    expect(result.type).toBe('ITEMS');

    // Aguarda um pouco
    await new Promise((resolve) => setTimeout(resolve, 100));

    const events = await prisma.messageParseEvent.findMany({
      where: { groupId: 'test-group', userId: 'test-user' },
    });

    // Não deve salvar quando usando MEMORY
    expect(events.length).toBe(0);
  });
});

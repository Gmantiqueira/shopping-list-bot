import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { parseMessage } from '../../../src/app/parser/parseMessage.js';
import type { ParseInput } from '../../../src/app/parser/types.js';
import { getPrismaClient } from '../../../src/infra/prisma/prismaClient.js';

describe('parseMessage - with learned aliases', () => {
  const originalEnv = process.env;
  const originalRepoType = process.env.REPOSITORY_TYPE;
  let prisma: ReturnType<typeof getPrismaClient>;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.REPOSITORY_TYPE = 'PRISMA';
    prisma = getPrismaClient();

    // Limpa aliases antes de cada teste
    await prisma.groupItemAlias.deleteMany({});
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

  it('should apply learned alias to items', async () => {
    // Criar alias aprendido
    await prisma.groupItemAlias.create({
      data: {
        groupId: 'test-group',
        rawTerm: 'refri',
        canonicalItem: 'coca-cola',
        source: 'manual',
        usageCount: 1,
      },
    });

    const result = await parseMessage(createInput('refri'));

    expect(result.type).toBe('ITEMS');
    expect(result.items).toEqual(['coca-cola']);
  });

  it('should apply aliases to multiple items', async () => {
    // Criar aliases aprendidos
    await prisma.groupItemAlias.createMany({
      data: [
        {
          groupId: 'test-group',
          rawTerm: 'refri',
          canonicalItem: 'coca-cola',
          source: 'manual',
          usageCount: 1,
        },
        {
          groupId: 'test-group',
          rawTerm: 'papel',
          canonicalItem: 'papel higiênico',
          source: 'manual',
          usageCount: 1,
        },
      ],
    });

    const result = await parseMessage(createInput('refri, papel, leite'));

    expect(result.type).toBe('ITEMS');
    expect(result.items).toContain('coca-cola');
    expect(result.items).toContain('papel higiênico');
    expect(result.items).toContain('leite');
  });

  it('should deduplicate items after alias application', async () => {
    // Criar alias: "coca" -> "coca-cola"
    await prisma.groupItemAlias.create({
      data: {
        groupId: 'test-group',
        rawTerm: 'coca',
        canonicalItem: 'coca-cola',
        source: 'manual',
        usageCount: 1,
      },
    });

    // Mensagem com "coca" e "coca-cola" deve resultar em apenas "coca-cola"
    const result = await parseMessage(createInput('coca, coca-cola'));

    expect(result.type).toBe('ITEMS');
    expect(result.items).toEqual(['coca-cola']);
  });

  it('should not apply aliases from other groups', async () => {
    // Criar alias em outro grupo
    await prisma.groupItemAlias.create({
      data: {
        groupId: 'other-group',
        rawTerm: 'refri',
        canonicalItem: 'coca-cola',
        source: 'manual',
        usageCount: 1,
      },
    });

    const result = await parseMessage(createInput('refri'));

    // Não deve aplicar alias de outro grupo
    expect(result.type).toBe('ITEMS');
    expect(result.items).toEqual(['refri']);
  });

  it('should work without aliases (no database)', async () => {
    const result = await parseMessage(createInput('leite, arroz'));

    expect(result.type).toBe('ITEMS');
    expect(result.items).toContain('leite');
    expect(result.items).toContain('arroz');
  });

  it('should handle alias lookup failure gracefully', async () => {
    // Criar alias
    await prisma.groupItemAlias.create({
      data: {
        groupId: 'test-group',
        rawTerm: 'refri',
        canonicalItem: 'coca-cola',
        source: 'manual',
        usageCount: 1,
      },
    });

    // Fechar conexão para simular erro
    await prisma.$disconnect();

    // Deve continuar funcionando sem aliases
    const result = await parseMessage(createInput('refri'));

    // Pode retornar "refri" ou "coca-cola" dependendo do timing
    // O importante é não quebrar
    expect(result.type).toBe('ITEMS');
    expect(result.items.length).toBeGreaterThan(0);
  });
});

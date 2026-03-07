import { describe, it, expect, beforeEach } from 'vitest';
import { AliasLearningService } from '../../../src/app/alias/aliasLearningService.js';
import { getPrismaClient } from '../../../src/infra/prisma/prismaClient.js';

describe('AliasLearningService - integration', () => {
  let service: AliasLearningService;
  let prisma: ReturnType<typeof getPrismaClient>;
  const originalRepoType = process.env.REPOSITORY_TYPE;

  beforeEach(async () => {
    service = new AliasLearningService();
    prisma = getPrismaClient();
    process.env.REPOSITORY_TYPE = 'PRISMA';

    // Limpa aliases antes de cada teste
    await prisma.groupItemAlias.deleteMany({});
  });

  afterEach(() => {
    if (originalRepoType) {
      process.env.REPOSITORY_TYPE = originalRepoType;
    } else {
      delete process.env.REPOSITORY_TYPE;
    }
  });

  it('should create and update alias', async () => {
    // Criar alias
    await service.saveManualAlias('test-group', 'refri', 'coca-cola');

    // Verificar que foi criado
    let alias = await service.findAlias('test-group', 'refri');
    expect(alias).not.toBeNull();
    expect(alias?.rawTerm).toBe('refri');
    expect(alias?.canonicalItem).toBe('coca-cola');

    // Atualizar alias (upsert)
    await service.saveManualAlias('test-group', 'refri', 'coca-cola zero');

    // Verificar que foi atualizado
    alias = await service.findAlias('test-group', 'refri');
    expect(alias?.canonicalItem).toBe('coca-cola zero');

    // Verificar no banco que usageCount foi incrementado
    const dbAlias = await prisma.groupItemAlias.findUnique({
      where: {
        groupId_rawTerm: {
          groupId: 'test-group',
          rawTerm: 'refri',
        },
      },
    });

    expect(dbAlias).not.toBeNull();
    expect(dbAlias?.usageCount).toBe(2);
  });

  it('should list aliases for a group', async () => {
    await service.saveManualAlias('test-group', 'refri', 'coca-cola');
    await service.saveManualAlias(
      'test-group',
      'papel higienico',
      'papel higiênico'
    );
    await service.saveManualAlias('other-group', 'refri', 'coca-cola');

    const aliases = await service.listAliases('test-group');

    expect(aliases.length).toBe(2);
    expect(aliases.map((a) => a.rawTerm)).toContain('refri');
    expect(aliases.map((a) => a.rawTerm)).toContain('papel higienico');
  });

  it('should increment usageCount on repeated saves', async () => {
    await service.saveManualAlias('test-group', 'refri', 'coca-cola');
    await service.saveManualAlias('test-group', 'refri', 'coca-cola');
    await service.saveManualAlias('test-group', 'refri', 'coca-cola');

    const dbAlias = await prisma.groupItemAlias.findUnique({
      where: {
        groupId_rawTerm: {
          groupId: 'test-group',
          rawTerm: 'refri',
        },
      },
    });

    expect(dbAlias?.usageCount).toBe(3);
  });
});

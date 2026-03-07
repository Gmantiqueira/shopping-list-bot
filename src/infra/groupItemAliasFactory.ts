import { PrismaGroupItemAliasRepository } from './prisma/groupItemAliasRepository.js';
import type { GroupItemAliasRepository } from '../domain/types.js';

export function createGroupItemAliasRepository(): GroupItemAliasRepository | null {
  // Só cria repositório se estiver usando PRISMA
  const repoType =
    (process.env.REPOSITORY_TYPE as 'MEMORY' | 'PRISMA') || 'MEMORY';

  if (repoType === 'PRISMA') {
    return new PrismaGroupItemAliasRepository();
  }

  // Se for MEMORY, retorna null (não persiste aliases)
  return null;
}

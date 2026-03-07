import { MemoryListItemRepository } from './memory/memoryRepository.js';
import { PrismaListItemRepository } from './prisma/prismaRepository.js';
import type { ListItemRepository } from '../domain/types.js';

export type RepositoryType = 'MEMORY' | 'PRISMA';

export function createRepository(type?: RepositoryType): ListItemRepository {
  const repoType =
    type || (process.env.REPOSITORY_TYPE as RepositoryType) || 'MEMORY';

  switch (repoType) {
    case 'PRISMA':
      return new PrismaListItemRepository();
    case 'MEMORY':
    default:
      return new MemoryListItemRepository();
  }
}

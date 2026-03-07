import { PrismaItemFeedbackRepository } from './prisma/itemFeedbackRepository.js';
import type { ItemFeedbackRepository } from '../domain/types.js';

export function createItemFeedbackRepository(): ItemFeedbackRepository | null {
  // Só cria repositório se estiver usando PRISMA
  const repoType =
    (process.env.REPOSITORY_TYPE as 'MEMORY' | 'PRISMA') || 'MEMORY';

  if (repoType === 'PRISMA') {
    return new PrismaItemFeedbackRepository();
  }

  // Se for MEMORY, retorna null (não persiste feedback)
  return null;
}

import { PrismaMessageParseEventRepository } from './prisma/messageParseEventRepository.js';
import type { MessageParseEventRepository } from '../domain/types.js';

export function createMessageParseEventRepository(): MessageParseEventRepository | null {
  // Só cria repositório se estiver usando PRISMA
  const repoType =
    (process.env.REPOSITORY_TYPE as 'MEMORY' | 'PRISMA') || 'MEMORY';

  if (repoType === 'PRISMA') {
    return new PrismaMessageParseEventRepository();
  }

  // Se for MEMORY, retorna null (não persiste eventos)
  return null;
}

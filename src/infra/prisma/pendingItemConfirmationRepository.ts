import { getPrismaClient } from './prismaClient.js';

const EXPIRE_MS = 2 * 60 * 1000; // 2 minutos

export interface PendingItemConfirmation {
  id: string;
  groupId: string;
  rawText: string;
  createdAt: Date;
}

export async function savePendingConfirmation(
  groupId: string,
  rawText: string
): Promise<PendingItemConfirmation> {
  const prisma = getPrismaClient();
  const row = await prisma.pendingItemConfirmation.create({
    data: { groupId, rawText },
  });
  return {
    id: row.id,
    groupId: row.groupId,
    rawText: row.rawText,
    createdAt: row.createdAt,
  };
}

/**
 * Retorna a confirmação pendente válida (não expirada) para o groupId.
 * Remove confirmações expiradas encontradas.
 */
export async function findValidPendingByGroupId(
  groupId: string
): Promise<PendingItemConfirmation | null> {
  const prisma = getPrismaClient();
  const cutoff = new Date(Date.now() - EXPIRE_MS);

  const row = await prisma.pendingItemConfirmation.findFirst({
    where: { groupId },
    orderBy: { createdAt: 'desc' },
  });

  if (!row) return null;
  if (row.createdAt < cutoff) {
    await prisma.pendingItemConfirmation.delete({ where: { id: row.id } });
    return null;
  }

  return {
    id: row.id,
    groupId: row.groupId,
    rawText: row.rawText,
    createdAt: row.createdAt,
  };
}

export async function deletePendingConfirmation(id: string): Promise<void> {
  const prisma = getPrismaClient();
  await prisma.pendingItemConfirmation.delete({ where: { id } });
}

import type { List } from '@prisma/client';
import { getPrismaClient } from './prismaClient.js';

const DEFAULT_TITLE = 'Lista atual';

/**
 * Localiza a lista aberta mais recente do cliente ou cria uma nova.
 *
 * @param customerId - ID do Customer
 * @returns A entidade List (existente ou recém-criada)
 */
export async function getOrCreateOpenListForCustomer(
  customerId: string
): Promise<List> {
  const prisma = getPrismaClient();

  const existing = await prisma.list.findFirst({
    where: {
      customerId,
      status: 'open',
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existing) {
    return existing;
  }

  return prisma.list.create({
    data: {
      customerId,
      title: DEFAULT_TITLE,
      status: 'open',
    },
  });
}

/**
 * Associa a lista ao chat (groupId) quando ainda não estiver definido.
 * Permite que listItems/addItems por groupId encontrem a mesma lista.
 */
export async function ensureListGroupId(
  listId: string,
  groupId: string
): Promise<void> {
  const prisma = getPrismaClient();
  await prisma.list.updateMany({
    where: { id: listId, groupId: null },
    data: { groupId },
  });
}

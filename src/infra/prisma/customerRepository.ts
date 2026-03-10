import type { Customer } from '@prisma/client';
import { getPrismaClient } from './prismaClient.js';
import { normalizePhone } from '../../domain/utils.js';

/**
 * Busca ou cria um Customer pelo telefone (upsert).
 * Normaliza o telefone (apenas dígitos) antes de consultar/salvar.
 *
 * @param phone - Número de telefone (obrigatório)
 * @param name - Nome do contato (opcional); se informado, atualiza o registro existente
 * @returns A entidade Customer
 */
export async function getOrCreateCustomerByPhone(
  phone: string,
  name?: string
): Promise<Customer> {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    throw new Error('Phone is required and must contain at least one digit');
  }

  const prisma = getPrismaClient();
  return prisma.customer.upsert({
    where: { phone: normalized },
    create: {
      phone: normalized,
      name: name ?? null,
    },
    update: {
      ...(name !== undefined && { name }),
    },
  });
}

import type { Customer } from '@prisma/client';
import { getPrismaClient } from './prismaClient.js';
import { normalizePhone } from '../../domain/utils.js';

export interface GetOrCreateCustomerResult {
  customer: Customer;
  created: boolean;
}

/**
 * Busca ou cria um Customer pelo telefone.
 * Normaliza o telefone (apenas dígitos) antes de consultar/salvar.
 *
 * @param phone - Número de telefone (obrigatório)
 * @param name - Nome do contato (opcional); se informado, atualiza o registro existente
 * @returns Customer e flag created (true se foi criado agora)
 */
export async function getOrCreateCustomerByPhone(
  phone: string,
  name?: string
): Promise<GetOrCreateCustomerResult> {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    throw new Error('Phone is required and must contain at least one digit');
  }

  const prisma = getPrismaClient();
  const existing = await prisma.customer.findUnique({
    where: { phone: normalized },
  });

  if (existing) {
    if (name !== undefined) {
      const updated = await prisma.customer.update({
        where: { id: existing.id },
        data: { name },
      });
      return { customer: updated, created: false };
    }
    return { customer: existing, created: false };
  }

  const customer = await prisma.customer.create({
    data: {
      phone: normalized,
      name: name ?? null,
    },
  });
  return { customer, created: true };
}

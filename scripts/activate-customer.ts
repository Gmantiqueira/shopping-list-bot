/**
 * Ativa manualmente um cliente por telefone (para testes).
 * Uso: pnpm tsx scripts/activate-customer.ts 5511999999999
 * Requer DATABASE_URL no .env (ou ambiente).
 */
import 'dotenv/config';
import { getOrCreateCustomerByPhone } from '../src/infra/prisma/customerRepository.js';
import { getPrismaClient } from '../src/infra/prisma/prismaClient.js';

const phoneRaw = process.argv[2];
if (!phoneRaw?.trim()) {
  console.error('Uso: pnpm tsx scripts/activate-customer.ts <telefone>');
  process.exit(1);
}

const prisma = getPrismaClient();

try {
  const { customer, created } = await getOrCreateCustomerByPhone(phoneRaw);
  await prisma.customer.update({
    where: { id: customer.id },
    data: { isActive: true },
  });
  if (created) {
    console.log('Cliente criado e ativado:', customer.phone);
  } else {
    console.log('Cliente ativado:', customer.phone);
  }
} catch (err) {
  console.error(
    err instanceof Error ? err.message : 'Erro ao ativar cliente',
    err
  );
  process.exit(1);
} finally {
  await prisma.$disconnect();
}

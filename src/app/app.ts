import Fastify from 'fastify';
import { createRepository } from '../infra/repositoryFactory.js';
import { registerHttpRoutes } from './http/routes.js';
import { registerWhatsAppWebhook } from './whatsapp/webhookController.js';
import { registerSimulatorRoutes } from './simulator/simulatorRoutes.js';

export const app = Fastify({
  logger: true,
});

// Repositório compartilhado (MEMORY ou PRISMA baseado em env)
const repository = createRepository();

// Health check
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Rotas HTTP
await registerHttpRoutes(app, repository);

// Webhook WhatsApp (opcional, só registra se configurado)
await registerWhatsAppWebhook(app, repository);

// Rotas do simulador web (SSE e histórico)
await registerSimulatorRoutes(app);
